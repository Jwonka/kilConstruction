KilCon Master To-Do List

This is the authoritative task list for the kilConstruction codebase.
Only update it after tasks are completed, verified, or newly discovered.

✅ Done

(Confirmed implemented, no further work expected)

Cloudflare Pages automatic deployments

GitHub → Cloudflare integration

R2 bucket (kilcon-gallery) configured and bound

/api/gallery/list-images functional

Astro → Cloudflare Pages migration completed

Public gallery uses R2, not Google Drive

Turnstile integration

Environment variables configured

Basic search bar and admin toolbar styling

Worker routing and Pages Functions routing

🔍 Needs Verification

(Behavior appears correct, but requires a targeted test)

API / Backend

Upload endpoint (/api/gallery/upload) works end-to-end with Photos > Admin

Delete endpoint (/api/gallery/delete) reliably deletes files and folders

Delete-project endpoint works for nested folders

R2 listing reflects real structure with no phantom folders

CORS logic correct for production + localhost

Error messages sent to UI correctly

Admin UI

No bullet points in folder tree

Checkbox alignment (left side of label)

Dropdown arrow positioned on folder line

No double labels (e.g., “Cabinets” + “Furniture Cabinets”)

Nested folder expansion renders correctly

Admin footer positioned at bottom

Toolbar and inputs do not overflow on small screens

Deployment / Config

Pages Functions are the only active API (no accidental Worker conflicts)

R2 permissions correct (write/read/delete)

🛠 Planned / Not Started

(Items we know are needed but haven’t begun)

Centralize constants (origins, regex, bucket paths) into /src/utils/constants.ts

Add retry/backoff logic for slow R2 deletes

Add upload size + extension validation (strict server-side)

Create fallback logs for pages functions (write to CF logs in detail)

Admin UI: improved empty folder state messaging

Add image count per folder in the admin tree

Add drag-and-drop upload for admin

❓ Future Ideas / Maybe Later

(Future enhancements, not commitments)

Pre-generate gallery thumbnails using a preprocessing script (not CF Workers)

Add multi-select keyboard shortcuts

Replace current folder tree with a virtualized explorer component

Add ability to rename folders/projects

Add staged deployments per PR with automated tests