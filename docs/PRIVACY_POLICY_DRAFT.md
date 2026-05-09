# Pawfolio Privacy Policy Draft

Last updated: 2026-05-09

## Overview

Pawfolio is a dog care app that helps people keep routines, reminders, care history, health documents, memories, and private backups for their own pet information.

This draft is intentionally lightweight for a small friend beta. It should be reviewed and expanded before any broader public launch.

## What Pawfolio Stores

Pawfolio may store:

- dog profile details you enter
- routine tasks and completion history
- reminders and reminder history
- diary entries and attached photos
- care records and care events
- health document metadata and uploaded document files
- app preferences and trust metadata
- private cloud backup data connected to your signed-in account

## How Sign-In Works

Pawfolio uses Google sign-in through Supabase Auth.

Your Pawfolio cloud backup belongs to the Google account that signs into Pawfolio. In this beta, Pawfolio does not provide shared caregiver access or cross-account sharing.

## How Cloud Backup Works

Pawfolio is local-first.

- this phone or browser is the working copy
- cloud is the private backup layer
- restore is an explicit action

When you restore, the app replaces the local Pawfolio on that device with the backup from the signed-in account.

Cloud backup may include:

- structured app state
- diary photos
- uploaded health documents

## Google Calendar Access

If you choose to connect Google Calendar, Pawfolio uses Google Calendar access only to create and sync your own reminder events to your own Google Calendar.

Pawfolio does not use Google Calendar access to read unrelated personal content beyond what is required for the intended calendar integration behavior.

## Notifications

If you enable notifications, Pawfolio may store device push subscription details needed to deliver reminder notifications to your saved device.

## Beta Status

Pawfolio is currently an early beta product.

That means:

- features may change
- bugs may exist
- users should report anything unexpected right away, especially anything related to privacy, incorrect restore behavior, or seeing the wrong data

## Data Deletion And Support

During this beta, users should contact the Pawfolio beta owner for:

- cloud backup deletion requests
- account/data deletion requests
- privacy questions
- support issues

Before a wider public launch, Pawfolio should provide a clearer permanent support and deletion workflow.
