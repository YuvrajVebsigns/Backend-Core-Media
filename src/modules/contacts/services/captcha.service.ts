import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios, { AxiosError } from 'axios';

export interface CaptchaVerificationResult {
  success: boolean;
  challengeTs?: string;
  hostname?: string;
  errorCode?: string;
  errors?: string[];
}

@Injectable()
export class CaptchaService {
  private readonly logger = new Logger(CaptchaService.name);
  private readonly turnstileSecret: string | undefined;
  private readonly turnstileVerifyUrl =
    'https://challenges.cloudflare.com/turnstile/v0/siteverify';

  constructor(private readonly configService: ConfigService) {
    this.turnstileSecret = this.configService.get<string>(
      'TURNSTILE_SECRET',
    );

    if (!this.turnstileSecret) {
      this.logger.warn(
        'TURNSTILE_SECRET is not configured. CAPTCHA verification will be disabled.',
      );
    }
  }

  /**
   * Verify Cloudflare Turnstile CAPTCHA token
   * @param token The CAPTCHA token from the client
   * @param remoteip Optional: Client IP address for additional verification
   * @returns Verification result with success status
   */
  async verifyCaptcha(
    token: string,
    remoteip?: string,
  ): Promise<CaptchaVerificationResult> {
    try {
      if (!token) {
        return {
          success: false,
          errorCode: 'MISSING_TOKEN',
          errors: ['CAPTCHA token is required'],
        };
      }

      if (!this.turnstileSecret) {
        this.logger.error(
          'TURNSTILE_SECRET is not configured. Cannot verify CAPTCHA.',
        );
        return {
          success: false,
          errorCode: 'MISSING_SECRET',
          errors: ['Server CAPTCHA configuration is incomplete'],
        };
      }

      // Prepare the request payload
      const payload = {
        secret: this.turnstileSecret,
        response: token,
      };

      if (remoteip) {
        payload['remoteip'] = remoteip;
      }

      // Send verification request to Cloudflare
      const response = await axios.post(this.turnstileVerifyUrl, payload, {
        headers: {
          'Content-Type': 'application/json',
        },
        timeout: 10000, // 10 second timeout
      });

      const { success, challenge_ts, hostname, error_codes } = response.data;

      this.logger.log(
        `CAPTCHA verification result: success=${success}, hostname=${hostname}`,
      );

      return {
        success: success === true,
        challengeTs: challenge_ts,
        hostname,
        errorCode: error_codes?.[0] || undefined,
        errors: error_codes || [],
      };
    } catch (error) {
      const axiosError = error as AxiosError;
      this.logger.error(
        `CAPTCHA verification request failed: ${axiosError.message}`,
        axiosError.response?.data || axiosError.message,
      );

      return {
        success: false,
        errorCode: 'VERIFICATION_FAILED',
        errors: ['Failed to verify CAPTCHA token with Cloudflare'],
      };
    }
  }
}
