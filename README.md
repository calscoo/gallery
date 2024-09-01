# Portfolio

This Terraform/Hugo/GHA stack creates an AWS Amplify app for a portfolio website, with a main branch and a webhook. GHA stands it up with manually triggered Actions and changes to the main branch trigger deployments via Amplify to the deployed Hugo application

## Resources Created

- An AWS Amplify app connected to a GitHub repository.
- A main branch for the Amplify app.
- A webhook that triggers a new build whenever changes are pushed to the main branch.
- Domain association with the Amplify Appication

## Prerequisites

- AWS account with necessary permissions to manage Amplify apps, S3 buckets, and Route53 (if using a custom domain).
- GitHub repository for your portfolio website.
- AWS access key and secret key for your AWS account.
    - These should be stored in the repo secrets so GHA can access them

## Usage

1. Navigate to the GitHub Actions section of this repo in GitHub.
2. Manually trigger the apply or destroy workflow to standup or teardown the AWS Amplify App.

## Continuous Deployment

The Amplify app is set up for continuous deployment. This means that any commit pushed to the main branch of the connected GitHub repository will automatically trigger a new build and deployment of the Hugo app. You can monitor the status of these builds in the AWS Amplify console.

## Post-Deployment Steps

You should be able to access your Amplify app at your custom domain after the DNS records propagate, which may take up to 48 hours.
