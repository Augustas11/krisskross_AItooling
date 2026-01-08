---
description: Monitor Vercel deployments and automatically fix build errors
---

# Vercel Deployment Monitoring Workflow

This workflow monitors the status of Vercel deployments and attempts to fix any build errors that occur.

1.  **Check Status**: Run `vercel list --prod` to identify the latest deployment and its status.
2.  **Inspect Logs**: If the status is `ERROR` or `BUILDING`, inspect the logs using `vercel inspect <url>` or by checking the build logs in the Vercel dashboard via the CLI url.
3.  **Auto-Fix**: 
    - Identify the specific error message (e.g., "Module not found", "Lint error", "Dynamic server usage").
    - Apply the necessary code fix (e.g., installing dependencies, fixing imports, handling dynamic routes).
    - Commit and push the fix or run `vercel --prod` to redeploy.
4.  **Verify**: Repeat the monitoring process until the deployment status is `READY`.
5.  **Report**: Notify the user of the successful deployment.

// turbo
vercel list --prod
