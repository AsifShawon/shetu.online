# EduWise V3 Docker Deployment

This guide is only for the new project in `Eduwise_V3/`. The legacy project in the repository root is not used by these Docker files.

## Stack

- Frontend: Next.js, container port `3000`
- Backend: Django, container port `8000`
- Database: MySQL `8.4`, internal service name `mysql`
- Production reverse proxy: FASTPANEL owns public ports `80` and `443`

## Local Development

```bash
cd Eduwise_V3
cp .env.local.example .env.local
nano .env.local
sh scripts/local-up.sh
```

Equivalent raw Compose command:

```bash
docker compose --env-file .env.local -f docker-compose.local.yml up --build
```

Local URLs:

```txt
Frontend: http://localhost:3000
Backend/API: http://localhost:8000
Backend ready: http://localhost:8000/ready
Backend health: http://localhost:8000/health
MySQL: localhost:3307
```

Stop local containers:

```bash
sh scripts/local-down.sh
```

Local development uses bind mounts for `frontend/` and `backend/`, Next.js dev mode, and Django `runserver`. The host-side MySQL port is controlled by `MYSQL_HOST_PORT` and defaults to `3307` so it does not collide with a local MySQL server already using `3306`.

## Production VPS Deployment

FASTPANEL should remain the only service listening on public ports `80` and `443`. Docker binds the app only to `127.0.0.1`.

The GitHub repository is private:

```txt
Repository: fleekbangladesh/EduWise-V2.0
Branch: asifshawon
```

Use SSH deploy key access on the VPS if possible. Add the VPS public key to GitHub as a deploy key with read access, then clone with SSH:

```bash
ssh root@217.216.33.85
mkdir -p /opt/apps/eduwise
cd /opt/apps/eduwise
git clone --branch asifshawon git@github.com:fleekbangladesh/EduWise-V2.0.git .
cd Eduwise_V3
cp .env.prod.example .env.prod
nano .env.prod
sh scripts/prod-up.sh
```

If you prefer HTTPS for the private repository, use a GitHub fine-grained personal access token with read access to `fleekbangladesh/EduWise-V2.0`. Do not paste tokens into `DEPLOYMENT.md`, commits, shell history, or `.env.prod`.

```bash
ssh root@217.216.33.85
mkdir -p /opt/apps/eduwise
cd /opt/apps/eduwise
git clone --branch asifshawon https://github.com/fleekbangladesh/EduWise-V2.0.git .
cd Eduwise_V3
cp .env.prod.example .env.prod
nano .env.prod
sh scripts/prod-up.sh
```

When prompted for HTTPS authentication, use your GitHub username and the token as the password. SSH deploy keys are cleaner for unattended `git pull --ff-only` in `scripts/prod-update.sh`.

Equivalent raw Compose command:

```bash
docker compose --env-file .env.prod -f docker-compose.prod.yml up -d --build
```

Production local upstreams:

```txt
Frontend container: 127.0.0.1:3011 -> frontend:3000
Backend container: 127.0.0.1:8011 -> backend:8000
MySQL: internal Docker network only, no host port
```

## FASTPANEL Reverse Proxy

Create reverse proxy site:

```txt
Domain: eduwise.fleeky.online
Backend/upstream: http://127.0.0.1:3011
```

Create reverse proxy site:

```txt
Domain: api.eduwise.fleeky.online
Backend/upstream: http://127.0.0.1:8011
```

DNS records if needed:

```txt
A    eduwise        217.216.33.85
A    api.eduwise    217.216.33.85
```

Then enable SSL/HTTPS for both domains in FASTPANEL.

## Production Smoke Tests

Run these on the VPS after `prod-up.sh`:

```bash
curl -I http://127.0.0.1:3011
curl http://127.0.0.1:8011/ready
curl http://127.0.0.1:8011/health
```

After FASTPANEL and DNS are ready:

```bash
curl -I https://eduwise.fleeky.online
curl https://api.eduwise.fleeky.online/ready
```

## Logs

All services:

```bash
cd Eduwise_V3
sh scripts/prod-logs.sh
```

Single service:

```bash
sh scripts/prod-logs.sh backend
sh scripts/prod-logs.sh frontend
sh scripts/prod-logs.sh mysql
```

## Production Updates

```bash
cd Eduwise_V3
sh scripts/prod-update.sh
```

The update script runs:

```txt
git pull --ff-only
docker compose build
docker compose up -d mysql
python manage.py migrate --noinput
docker compose up -d
docker compose ps
```

Django migrations are the detected migration system for this backend.

### Professional assessment reports

The backend image includes WeasyPrint, Pango, HarfBuzz, and Noto fonts for branded
assessment-report PDFs. Always rebuild the backend image when report templates,
fonts, or `backend/requirements.txt` change:

```bash
sh scripts/prod-update.sh
```

The professional report migration is additive: existing reports remain on schema
version 1 and are rendered through the compatibility adapter; new reports use
schema version 2 and create immutable snapshots at submission.

After deployment, verify the PDF engine inside the running image:

```bash
docker compose --env-file .env.prod -f docker-compose.prod.yml exec backend weasyprint --info
docker compose --env-file .env.prod -f docker-compose.prod.yml exec backend python manage.py check --deploy
```

Then smoke-test a submitted report as its assigned consultant or an admin. Student
report content and PDF downloads intentionally remain unavailable until admin
approval.

## Database Access

From the VPS terminal:

```bash
cd Eduwise_V3
docker compose --env-file .env.prod -f docker-compose.prod.yml exec mysql mysql -u "$MYSQL_USER" -p "$MYSQL_DATABASE"
```

If shell variable expansion does not use values from `.env.prod`, load them first:

```bash
set -a
. ./.env.prod
set +a
docker compose --env-file .env.prod -f docker-compose.prod.yml exec mysql mysql -u "$MYSQL_USER" -p "$MYSQL_DATABASE"
```

Backups:

```bash
set -a
. ./.env.prod
set +a
docker compose --env-file .env.prod -f docker-compose.prod.yml exec mysql mysqldump -u "$MYSQL_USER" -p "$MYSQL_DATABASE" > eduwise-$(date +%F).sql
```

Store backups outside the application directory and copy them off the VPS regularly.

## Optional Local Adminer

Adminer is not enabled in production. If you add it later, expose it only on localhost, for example `127.0.0.1:8080:8080`, and do not create a public FASTPANEL site for it.

## Production Checklist

- MySQL is not exposed publicly.
- MySQL user password is not a default or placeholder.
- MySQL root password is not a default or placeholder.
- `NEXT_PUBLIC_API_BASE_URL=https://api.eduwise.fleeky.online`.
- `SERVER_API_BASE_URL=http://backend:8000`.
- `CSRF_COOKIE_DOMAIN=.eduwise.fleeky.online`.
- `DJANGO_SECRET_KEY` is a long random value.
- `DJANGO_DEBUG=false`.
- Docker does not bind ports `80` or `443`.
- Frontend binds only to `127.0.0.1:3011`.
- Backend binds only to `127.0.0.1:8011`.
- FASTPANEL handles HTTPS certificates and public traffic.
- `.env.prod` is not committed.
- Database backups are scheduled and tested.

## Important Environment Notes

Django currently reads database configuration from:

```txt
MYSQL_DATABASE
MYSQL_USER
MYSQL_PASSWORD
MYSQL_HOST
MYSQL_PORT
```

The `DATABASE_URL` value in the example env files is included for portability and documentation, but this Django codebase does not currently parse it.
