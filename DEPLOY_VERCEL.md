# Deploy front-end to Vercel

These instructions show how to deploy the frontend (Next.js) to Vercel. The frontend is safe to host on Vercel because it does not require GPU or large model files. The backend (image generation + SD-WebUI) must be hosted separately and provide a public HTTPS API that the frontend can call.

Steps

1. Connect repository
- Go to https://vercel.com and sign in.
- Click "New Project" → "Import Git Repository" → choose GitHub and select `thiagocod8-eng/slidemaker`.

2. Configure project
- Framework Preset: Next.js (Vercel auto-detects).
- Install Command: `npm install` (default)
- Build Command: `npm run build`
- Output Directory: leave empty (Vercel uses Next.js defaults)

3. Environment variables
- Set the following Environment Variable in Vercel (Project Settings → Environment Variables):
  - NEXT_PUBLIC_API_BASE = https://your-backend.example.com

Replace `https://your-backend.example.com` with the URL where you host the backend API (the Express server in this scaffold). The backend must be accessible over HTTPS for the browser to avoid mixed-content issues.

4. Deploy
- Click "Deploy". Vercel will build and publish the frontend. After deployment, your frontend will be available at `https://<project>.vercel.app`.

5. Backend considerations
- The backend (Express) should be hosted on a separate server (DigitalOcean, Render, Railway, an HTTPS-enabled VM, or similar). The SD-WebUI image-generation service requires a machine with a GPU to provide acceptable performance. Vercel cannot host GPU workloads.
- Ensure CORS is configured on the backend to accept requests from your Vercel domain.
- Set the environment variable on Vercel to point to the backend base URL (e.g., `https://api.yoursite.com`).

6. Optional: custom domain
- Add a custom domain on Vercel if you have one and update environment variables accordingly.

Notes
- If you don't yet have a backend URL, you can still deploy the frontend and later update the NEXT_PUBLIC_API_BASE environment variable when the backend is available.
- For local testing with the backend running on your machine, set NEXT_PUBLIC_API_BASE to `http://localhost:4000` in a local .env file (do not commit secrets).

If you want, I can also prepare Dockerfiles and deployment instructions for hosting the backend on Render or Railway and add a small CI workflow. Tell me which provider you'd like and I will add the files and a PR.
