This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Phase 1: Teacher authentication prototype

The implementation follows Figma file `hWTpQwbyreDsivI3tZ0yLa`, **Page 1 → Redesign Guru**:

- Login: `291:15929`
- Register: `291:15974`
- Google registration state: `291:16035`
- Design system page: `244:845`

These three frames are direct children of Page 1, arranged beneath the Redesign Guru canvas label, between Form Survei Guru and Redesign Siswa. The authentication frames' specific spacing and 12 px control radii take precedence over generic library defaults. The four SVG icons in `public/auth/` are downloaded Figma assets. Branding, gradient and circles are native layout elements in the reference, reproduced in CSS.

Routes: `/` redirects to `/login`; `/register` and `/register/google` cover registration. Successful simulations navigate to `/guru/dashboard`, which contains only a placeholder.

Use **guru@example.com** and **DemoGuru123!** for mock login. Registration accepts fictional `@example.com` emails and the same public demo password; “Isi data contoh” fills an example. Registration does not create an account or change the login fixture. Google buttons simulate a local delay and open a fixed fictional identity; changing the Google account displays an explanatory message. Password recovery also displays local feedback only.

All validation and simulated delays run in the browser. Forms have no API/server action, do not serialize field names, and do not store credentials, accounts, cookies or authentication tokens. Do not enter real credentials or personal information. Dashboard access is intentionally unprotected because there is no authentication system.

Only desktop Figma frames were supplied. Tablet/mobile layouts are responsive adaptations: the brand panel stacks above the form, text wraps, and notices remain scrollable. A visible prototype notice and fictional email addresses are intentional additions to the Figma design.

Validation commands: `npm run lint` and `npm run build`. No Student, survey, FOMO, COMMIT, OAuth or backend functionality is included.

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
