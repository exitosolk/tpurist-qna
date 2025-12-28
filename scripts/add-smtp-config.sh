#!/bin/bash

# OneCeylon - Add SMTP Configuration
# Run this script to add SMTP settings to your .env.local file

echo "Adding SMTP configuration to .env.local..."

# Read current .env.local or create new one
ENV_FILE=".env.local"

# Prompt for SMTP details
read -p "Enter SMTP Host (default: smtp.gmail.com): " SMTP_HOST
SMTP_HOST=${SMTP_HOST:-smtp.gmail.com}

read -p "Enter SMTP Port (default: 587): " SMTP_PORT
SMTP_PORT=${SMTP_PORT:-587}

read -p "Enter SMTP User (email address): " SMTP_USER

read -sp "Enter SMTP Password (App Password for Gmail): " SMTP_PASSWORD
echo

read -p "Enter SMTP From (default: OneCeylon <noreply@oneceylon.space>): " SMTP_FROM
SMTP_FROM=${SMTP_FROM:-"OneCeylon <noreply@oneceylon.space>"}

# Add to .env.local
echo "" >> $ENV_FILE
echo "# Email Configuration (Added on $(date))" >> $ENV_FILE
echo "SMTP_HOST=$SMTP_HOST" >> $ENV_FILE
echo "SMTP_PORT=$SMTP_PORT" >> $ENV_FILE
echo "SMTP_USER=$SMTP_USER" >> $ENV_FILE
echo "SMTP_PASSWORD=$SMTP_PASSWORD" >> $ENV_FILE
echo "SMTP_FROM=\"$SMTP_FROM\"" >> $ENV_FILE

echo "✓ SMTP configuration added to $ENV_FILE"
echo ""
echo "Now restart your application:"
echo "  pm2 restart oneceylon"
