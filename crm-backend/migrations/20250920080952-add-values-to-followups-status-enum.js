'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    // This is a safe way to add new ENUM values in PostgreSQL
    // It checks if the value exists before trying to add it, preventing errors.
    await queryInterface.sequelize.query(`
      DO $$ BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'pending' AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'enum_FollowUps_status')) THEN
          ALTER TYPE "enum_FollowUps_status" ADD VALUE 'pending';
        END IF;
        IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'done' AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'enum_FollowUps_status')) THEN
          ALTER TYPE "enum_FollowUps_status" ADD VALUE 'done';
        END IF;
        IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'cancelled' AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'enum_FollowUps_status')) THEN
          ALTER TYPE "enum_FollowUps_status" ADD VALUE 'cancelled';
        END IF;
      END $$;
    `);
  },

  async down (queryInterface, Sequelize) {
    // Removing ENUM values can be complex and is often not needed for rollback.
    // We will leave this empty.
  }
};