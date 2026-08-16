# SwipeX - Complete Docker & CI/CD Procedure Guide

This guide provides step-by-step instructions on how to use **Docker** locally and how the **GitHub Actions CI/CD Pipeline** works for the SwipeX project.

---

## 🛠️ Section 1: Running Docker Locally

### Prerequisites
- Install [Docker Desktop](https://www.docker.com/products/docker-desktop/) (Windows/Mac) or Docker Engine (Linux).
- Ensure Docker Desktop is running.

---

### Step 1: Build & Start All Containers
Open your terminal (PowerShell, Command Prompt, or Bash) in the project root directory (`swipex-module1-with-admin`) and run:

```bash
docker compose up --build
```

> **What happens during this step:**
> 1. Docker downloads the `postgres:15-alpine` image and starts the database container (`swipex_db`).
> 2. Docker waits for PostgreSQL healthcheck to pass (`pg_isready`).
> 3. Docker builds the Python backend container (`swipex_backend`) and starts FastAPI on port `8000`.
> 4. Docker builds the React Vite frontend container (`swipex_frontend`) multi-stage with Nginx and starts it on port `3000`.

---

### Step 2: Verify Running Services
In a separate terminal window, run:

```bash
docker compose ps
```

You should see 3 running containers:
- `swipex_db` (Status: `healthy`)
- `swipex_backend` (Ports: `8000->8000`)
- `swipex_frontend` (Ports: `3000->80`)

---

### Step 3: Access the Applications
- **Frontend App**: Open [http://localhost:3000](http://localhost:3000)
- **Backend Swagger API Docs**: Open [http://localhost:8000/docs](http://localhost:8000/docs)
- **Backend Health Check**: Open [http://localhost:8000](http://localhost:8000)

---
      
### Step 4: Stop the Stack
To stop the containers:

```bash
docker compose down
```

To stop containers and clear persistent database volumes (fresh start):

```bash
docker compose down -v
```

---

## 🚀 Section 2: CI/CD Pipeline (GitHub Actions)

The repository includes an automated workflow defined in [.github/workflows/ci-cd.yml](file:///.github/workflows/ci-cd.yml).

### Workflow Overview
Every time code is pushed to `main` or `master` (or a Pull Request is opened):
1. **Backend CI Job**: Runs `pytest` automated backend unit tests.
2. **Frontend CI Job**: Runs `npm run build` to ensure zero compilation or syntax errors in React/Vite.
3. **Docker Build Job**: Tests building the complete multi-container stack with `docker compose build`.

---

### Step-by-Step Procedure to Enable & Trigger CI/CD

#### Step 1: Commit Your Changes
Ensure all new files (`.github/workflows/ci-cd.yml`, `docker-compose.yml`, etc.) are tracked and committed:

```bash
git add .
git commit -m "feat: setup docker containerization and github actions ci/cd pipeline"
```

#### Step 2: Push to GitHub
Push your repository to GitHub:

```bash
git push origin main
```
*(Replace `main` with your default branch name if different, e.g., `master`)*

#### Step 3: Monitor Workflow Execution
1. Navigate to your repository on GitHub (`https://github.com/your-username/swipex`).
2. Click on the **Actions** tab at the top.
3. You will see **SwipeX CI/CD Pipeline** running automatically.
4. Click on the workflow run to view real-time logs for:
   - `Backend CI (Tests & Linting)`
   - `Frontend CI (Build & Lint)`
   - `Docker Build Check`

---

## 🌐 Section 3: (Optional) Automatic CD & Container Registry Push

If you wish to automatically build and push Docker images to **Docker Hub** or **GitHub Container Registry (GHCR)** upon merge to main, follow these steps:

### Step 1: Add GitHub Secrets
In your GitHub repository:
1. Go to **Settings** > **Secrets and variables** > **Actions**.
2. Click **New repository secret**.
3. Add:
   - `DOCKERHUB_USERNAME`: Your Docker Hub username.
   - `DOCKERHUB_TOKEN`: Your Docker Hub access token.

### Step 2: Add CD Push Job to `ci-cd.yml`
You can append the following job to `.github/workflows/ci-cd.yml`:

```yaml
  docker-push:
    name: Build & Push Docker Images
    needs: [backend-ci, frontend-ci, docker-build]
    if: github.ref == 'refs/heads/main'
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Log in to Docker Hub
        uses: docker/login-action@v3
        with:
          username: ${{ secrets.DOCKERHUB_USERNAME }}
          password: ${{ secrets.DOCKERHUB_TOKEN }}

      - name: Build & Push Backend Image
        uses: docker/build-push-action@v5
        with:
          context: ./backend
          push: true
          tags: ${{ secrets.DOCKERHUB_USERNAME }}/swipex-backend:latest

      - name: Build & Push Frontend Image
        uses: docker/build-push-action@v5
        with:
          context: ./frontend
          push: true
          tags: ${{ secrets.DOCKERHUB_USERNAME }}/swipex-frontend:latest
```

---

## 📊 Summary of Modified & Created Files

| File Path | Description |
|---|---|
| [docker-compose.yml](file:///docker-compose.yml) | Updated Docker Compose configuration with PostgreSQL healthchecks and network isolation |
| [.github/workflows/ci-cd.yml](file:///.github/workflows/ci-cd.yml) | GitHub Actions CI/CD Pipeline configuration |
| [DOCKER_CICD_GUIDE.md](file:///DOCKER_CICD_GUIDE.md) | Step-by-step procedure guide for local Docker & CI/CD execution |
