'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('Notes', 'title', {
      type: Sequelize.STRING,
      allowNull: true,
      comment: 'Optional title for the note'
    });

    await queryInterface.addColumn('Notes', 'type', {
      type: Sequelize.STRING,
      allowNull: true,
      defaultValue: 'general',
      comment: 'Type of note (general, important, reminder, etc.)'
    });

    await queryInterface.addColumn('Notes', 'priority', {
      type: Sequelize.STRING,
      allowNull: true,
      defaultValue: 'medium',
      comment: 'Priority level (low, medium, high)'
    });

    await queryInterface.addColumn('Notes', 'managerComment', {
      type: Sequelize.TEXT,
      allowNull: true,
      comment: 'Manager comment on the note'
    });

    await queryInterface.addColumn('Notes', 'managerCommentBy', {
      type: Sequelize.STRING,
      allowNull: true,
      comment: 'Name of manager who added comment'
    });

    await queryInterface.addColumn('Notes', 'managerCommentAt', {
      type: Sequelize.DATE,
      allowNull: true,
      comment: 'Date when manager comment was added'
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn('Notes', 'title');
    await queryInterface.removeColumn('Notes', 'type');
    await queryInterface.removeColumn('Notes', 'priority');
    await queryInterface.removeColumn('Notes', 'managerComment');
    await queryInterface.removeColumn('Notes', 'managerCommentBy');
    await queryInterface.removeColumn('Notes', 'managerCommentAt');
  }
};








