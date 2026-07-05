# Website Cookie Consent & Activity Tracking Integration Guide

This guide is designed for the **Website AI Agent** to implement the visitor tracking and cookie consent banner on client-side websites. It outlines the backend endpoint specifications, payload schemas, visitor state lifecycles, and provides a ready-to-use JavaScript tracker client.

---

## 1. Core Architecture Overview

The analytics system works via a public tracking API hosted on the Core Media Backend. Each website logs visitor actions, pageviews, and consent changes.

- **API Endpoint:** `POST <BACKEND_URL>/website/analytics/track`
- **Authentication:** Bearer token authorization using the website's unique tracking token.
  - **Header:** `Authorization: Bearer <WEBSITE_TOKEN>`
- **Rate-Limiting:** The endpoint is rate-limited on the backend to prevent DDoS/spam. The client should fail gracefully if it encounters a `429 Too Many Requests`.

---

## 2. Visitor & Session Lifecycles

To ensure accurate session counting and unique visitor metrics, the client site must generate and persist two identification strings:

### A. Visitor ID (`visitorId`)
- **Format:** A unique string prefix + UUID/random string (e.g., `vis_xxxxxxxxx` or standard UUIDv4).
- **Persistence:** Store in `localStorage` under the key `core_media_visitor_id`. It should persist indefinitely across browser restarts.

### B. Session ID (`sessionId`)
- **Format:** A unique string prefix + UUID/random string (e.g., `sess_xxxxxxxxx` or standard UUIDv4).
- **Persistence:** Store in `sessionStorage` under the key `core_media_session_id`. It must clear automatically when the user closes their browser tab or window.

---

## 3. Payload Schema

Every event sent to `POST /website/analytics/track` must conform to the following JSON structure:

```json
{
  "visitorId": "vis_8a7c29d0f41b",
  "sessionId": "sess_9b8d1e2f3c4a",
  "eventType": "pageview",
  "pageUrl": "/blog/latest-news",
  "pageTitle": "Latest News - CIO Choice",
  "referrer": "https://google.com",
  "userAgent": "Mozilla/5.0...",
  "metadata": {
    "elementId": "newsletter-signup-btn",
    "elementText": "Subscribe"
  }
}
```

### Event Types (`eventType`)
1. `pageview`: Triggered when a page or route finishes loading.
2. `consent_accepted`: Triggered when the user clicks "Accept" on the cookie consent banner.
3. `consent_declined`: Triggered when the user clicks "Decline" on the cookie consent banner.
4. `interaction`: Triggered for clicks, form submits, and other specific user actions.

---

## 4. Javascript Client: `CoreMediaTracker`

Below is a complete, drop-in Vanilla JavaScript class that manages consent, cookies, session lifecycles, and network calls.

```javascript
/**
 * CoreMediaTracker - Client-side tracking utility
 */
class CoreMediaTracker {
  constructor(config) {
    this.backendUrl = config.backendUrl.replace(/\/$/, '');
    this.token = config.token;
    this.cookieConsentKey = 'core_media_cookie_consent';
    this.visitorIdKey = 'core_media_visitor_id';
    this.sessionIdKey = 'core_media_session_id';
    
    this.initIds();
  }

  // Initialize unique IDs
  initIds() {
    // Visitor ID (Persistent)
    if (!localStorage.getItem(this.visitorIdKey)) {
      localStorage.setItem(this.visitorIdKey, 'vis_' + this.generateUUID());
    }
    this.visitorId = localStorage.getItem(this.visitorIdKey);

    // Session ID (Temporary)
    if (!sessionStorage.getItem(this.sessionIdKey)) {
      sessionStorage.setItem(this.sessionIdKey, 'sess_' + this.generateUUID());
    }
    this.sessionId = sessionStorage.getItem(this.sessionIdKey);
  }

  generateUUID() {
    return 'xxxxxxxxxxxx4xxxyxxxxxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
      const r = (Math.random() * 16) | 0;
      const v = c === 'x' ? r : (r & 0x3) | 0x8;
      return v.toString(16);
    });
  }

  // Consent Status management
  getConsentStatus() {
    return localStorage.getItem(this.cookieConsentKey); // 'accepted', 'declined', or null
  }

  setConsent(status) {
    if (status !== 'accepted' && status !== 'declined') return;
    
    localStorage.setItem(this.cookieConsentKey, status);
    
    // Log the consent decision to the backend
    this.trackEvent({
      eventType: status === 'accepted' ? 'consent_accepted' : 'consent_declined'
    });
  }

  // Core Track Method
  async trackEvent(eventData) {
    const consent = this.getConsentStatus();
    
    // If user explicitly declined cookies, do not track pageviews or interactions
    if (consent === 'declined' && !eventData.eventType.startsWith('consent_')) {
      return;
    }

    const payload = {
      visitorId: this.visitorId,
      sessionId: this.sessionId,
      eventType: eventData.eventType || 'pageview',
      pageUrl: eventData.pageUrl || window.location.pathname,
      pageTitle: eventData.pageTitle || document.title,
      referrer: eventData.referrer || document.referrer || 'direct',
      userAgent: navigator.userAgent,
      metadata: eventData.metadata || {}
    };

    try {
      const response = await fetch(`${this.backendUrl}/website/analytics/track`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.token}`
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        console.warn(`[Tracker] Analytics post failed with status: ${response.status}`);
      }
    } catch (error) {
      console.error('[Tracker] Network error posting analytics data:', error);
    }
  }

  // Shortcut for tracking pageviews
  trackPageview() {
    this.trackEvent({ eventType: 'pageview' });
  }

  // Shortcut for tracking custom interactions
  trackInteraction(elementId, elementText = '', extraMetadata = {}) {
    this.trackEvent({
      eventType: 'interaction',
      metadata: {
        elementId,
        elementText,
        ...extraMetadata
      }
    });
  }
}
```

---

## 5. Cookie Consent Banner UI Spec

For optimal conversion, implement a modern, responsive, and elegant consent banner.

### Visual Design Guidelines
- **Layout:** Fixed banner at the bottom (full width or floating card in the bottom-left/right).
- **Styling:** Glassmorphism overlay (semi-transparent blur background) with smooth slide-up animation.
- **Actions:** 
  - A prominent primary "Accept All Cookies" button.
  - A secondary "Decline Optional Cookies" button.

### Implementation Checklist
1. **Initial Load check:** When the website loads, read the consent status via `tracker.getConsentStatus()`.
2. **Display Banner:** If the status is `null`, display the consent banner with a smooth fade-in/slide-up transition.
3. **Store choice:**
   - **Accept Click:** Call `tracker.setConsent('accepted')` and hide the banner. Immediately call `tracker.trackPageview()` to register the initial visit.
   - **Decline Click:** Call `tracker.setConsent('declined')` and hide the banner. No further analytics should be sent.

---

## 6. Prompt to Give the Website Builder AI Agent

Copy and paste the prompt below directly to your website builder agent:

```text
Please implement a Cookie Consent Banner and Visitor Activity Tracking system on this website. Follow these requirements carefully:

1. Copy the JavaScript "CoreMediaTracker" class defined in the provided integration guide.
2. Initialize this tracker on the main window layout using our website's private token and the backend API URL. Make sure to keep the token secured/configured.
3. Add a beautiful, responsive, and animated Cookie Consent Banner that floats at the bottom of the viewport:
   - Check if consent choice already exists (localstorage key 'core_media_cookie_consent').
   - If not set, display the banner using smooth slide-up CSS transition.
   - Provide "Accept All" and "Decline" actions.
   - If "Accept All" is clicked, save state as 'accepted', report the 'consent_accepted' event, and begin tracking the session.
   - If "Decline" is clicked, save state as 'declined', report the 'consent_declined' event, and stop all tracking.
4. Auto-track pageviews ('pageview' event type) on initial page load and on route transitions (if this is a single page application/Next.js/React site).
5. Track critical client interactions:
   - Listen for button and link clicks on contact forms, newsletter submissions, and sponsor sections.
   - Report them as 'interaction' event type, populated with the clicked element's ID, text/label, and classnames.
6. Ensure that if the tracking API fails or returns rate-limiting responses, it fails silently in the console without breaking any page logic or blocking the user interface.
```
