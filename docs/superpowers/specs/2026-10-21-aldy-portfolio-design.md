# Aldy portfolio design

Approved direction with the October 23 requirements incorporated.

Use ocean blue #075985, navy #123047, white #FFFFFF, pale blue #EAF5FA, and body text #475569. Typography uses locally hosted Montserrat. The ocean illustration represents Aldy’s field of study without implying that a generated image depicts a real event.

The portfolio has home, about, experience list and detail, CV, and contact pages in English. Original organization and event names are preserved. Content comes from the supplied CV. Do not invent projects, awards, results, or photos.

Next.js stays in `fe` and Express in `be`. Supabase provides PostgreSQL, Storage, and Auth. The admin dashboard has an overview, experience management, and an image library. Admin access requires a confirmed Supabase Auth account matching the configured email. The backend uses server-only credentials for database and storage operations. Public visitors never receive those keys.

The repository is an npm workspace monorepo with a root lockfile. The owner deploys both applications to Vercel. No deployment is requested from the assistant. The requested GitHub remote is `https://github.com/aldyyesss/aldy-portfolio`.
