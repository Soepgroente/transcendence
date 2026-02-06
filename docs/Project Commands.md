### **Project Commands**

```bash
# Install all dependencies
pnpm install

# Run development servers
pnpm dev

# Run only backend server
pnpm dev:backend 

#Run only frontend server
pnpm dev:frontend

# Build for production
pnpm build

# Lint code
pnpm lint

# Format code
pnpm format

# Clean build and node_modules
pnpm clean
```

### **Database commands**

**from root directory run:**

```bash
# Generate migration from schema changes
pnpm --filter backend db:generate

# Apply migrations
pnpm --filter backend db:migrate

# Open Drizzle Studio (database GUI)
pnpm --filter backend studio
```
