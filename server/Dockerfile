# The API server. Node runs the app; Python (PyMuPDF) is installed too because PDF uploads are read by a small Python
# script the server starts for each file (see src/common/pdf/pdf_python_bridge.ts).
FROM node:22-bookworm-slim

RUN apt-get update \
    && apt-get install -y --no-install-recommends python3 python3-venv \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app
RUN chown node:node /app

# Python packages first, so this slow step is reused when only the app code changes.
COPY python/pdf_extractor/requirements.txt python/pdf_extractor/requirements.txt
RUN python3 -m venv /opt/venv && /opt/venv/bin/pip install --no-cache-dir -r python/pdf_extractor/requirements.txt
ENV PYTHON_BIN=/opt/venv/bin/python

# All dependencies are installed, including dev ones: the build needs TypeScript, and the start command runs the
# database migration tool (drizzle-kit).
COPY package.json package-lock.json ./
RUN npm ci

COPY . .
RUN npm run build

ENV NODE_ENV=production
USER node

# Render sets PORT. The database is brought up to date, then the server starts.
CMD ["sh", "-c", "npm run db:migrate && node ./dist/src/index.js"]
