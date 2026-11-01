# Lintelly HR als Container: ohne Schalter stdio (Docker MCP Catalog), mit --http Streamable HTTP auf Port 8787.
FROM node:22-alpine AS bau
WORKDIR /app
COPY package.json package-lock.json ./
COPY packages/kern/package.json packages/kern/
COPY packages/mcp/package.json packages/mcp/
RUN npm ci --ignore-scripts
COPY packages packages
RUN npm run build

FROM node:22-alpine
LABEL org.opencontainers.image.source="https://github.com/Lintelly/lintelly-hr-deutschland" \
      org.opencontainers.image.description="Lintelly HR Deutschland: German employment law as an MCP server, Germany only" \
      org.opencontainers.image.licenses="MIT" \
      io.modelcontextprotocol.server.name="com.lintelly/hr-deutschland"
WORKDIR /app
COPY --from=bau /app/packages/mcp/dist/lintelly-hr-mcp-server.mjs ./lintelly-hr-mcp.mjs
ENV HOST=0.0.0.0 PORT=8787 NODE_ENV=production
EXPOSE 8787
USER node
ENTRYPOINT ["node", "/app/lintelly-hr-mcp.mjs"]
