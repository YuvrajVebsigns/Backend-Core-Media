import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { getModelToken } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { SidebarMenu } from '../core/sidebar-menu/sidebar-menu.schema';

async function run() {
  console.log('🌱 Starting database fix for Variables sidebar menu...');
  const app = await NestFactory.createApplicationContext(AppModule);
  try {
    const sidebarMenuModel: Model<SidebarMenu> = app.get(getModelToken(SidebarMenu.name));

    // Find parent menu
    const parent = await sidebarMenuModel.findOne({ name: 'Communications' });
    if (!parent) {
      console.log('❌ Communications parent menu not found!');
      return;
    }

    // Delete existing Variables submenu
    const deleted = await sidebarMenuModel.deleteMany({ name: 'Variables' });
    console.log(`🗑️ Deleted ${deleted.deletedCount} old Variables menu(s)`);

    // Re-create Variables with correct parentId as a real ObjectId
    const created = await sidebarMenuModel.create({
      name: 'Variables',
      path: '/variables',
      permissionKey: 'communications.view',
      icon: 'braces',
      order: 4,
      group: 'content management',
      parentId: parent._id as any,
    });
    console.log('✅ Successfully created Variables menu with parentId:', parent._id);
  } catch (err) {
    console.error('❌ Error during DB fix:', err);
  } finally {
    await app.close();
  }
}

run().catch((err) => {
  console.error('Fatal error running DB fix:', err);
  process.exit(1);
});
