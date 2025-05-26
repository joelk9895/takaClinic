# Test Data Generation Script

This script generates sample data for the Taka Clinic Management System, including:

- Sample doctor accounts
- Daily patient records with the 4 key data points:
  1. Total amount from old patients
  2. Total amount from new patients
  3. Number of old patients (revisits)
  4. Number of new patients

## Setup

1. Install dependencies:
   ```
   npm install dotenv firebase
   ```

2. Ensure your `.env.local` file is properly configured with Firebase credentials.

## Usage

Run the script with:

```bash
node generateTestData.js [startDate] [endDate]
```

### Parameters:

- `startDate` (optional): Start date in YYYY-MM-DD format
- `endDate` (optional): End date in YYYY-MM-DD format

If no dates are provided, the script will generate data for the last 60 days.

### Examples:

```bash
# Generate data for the last 60 days (default)
node generateTestData.js

# Generate data for a specific date range
node generateTestData.js 2024-01-01 2024-03-31
```

## Features

- Creates sample doctor accounts if they don't already exist
- Generates realistic daily records with random patient counts and amounts
- Skips weekends for more realistic clinic data
- Occasionally skips days (10% chance) to simulate missing data
- Outputs progress to the console
