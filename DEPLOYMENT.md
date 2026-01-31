# Deployment Guide - Web3 Yield Tracker

## Overview

This guide covers deploying the Web3 Yield Tracker platform to production environments. The platform consists of a Node.js backend API, React frontend, PostgreSQL database, and Redis cache.

## Architecture Summary

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Load Balancer │    │   Frontend      │    │   Backend API   │
│   (Nginx/ALB)   │◀──▶│   (React)       │◀──▶│   (Node.js)     │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                                                       │
                                                       ▼
                              ┌─────────────────┐    ┌─────────────────┐
                              │   Database      │    │   Cache         │
                              │   (PostgreSQL)  │    │   (Redis)       │
                              └─────────────────┘    └─────────────────┘
                                       │
                                       ▼
                              ┌─────────────────┐
                              │   Ethereum      │
                              │   RPC Provider  │
                              └─────────────────┘
```

## Prerequisites

- Docker & Docker Compose
- Node.js 18+ (for local development)
- PostgreSQL 15+
- Redis 7+
- Ethereum RPC endpoint (Alchemy, Infura, etc.)
- SSL certificate (for production)

---

## Local Development Setup

### 1. Clone and Setup
```bash
git clone <repository-url>
cd yield-tracker

# Copy environment files
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env
```

### 2. Configure Environment Variables

**Backend (.env):**
```bash
# Server
PORT=3001
NODE_ENV=development
FRONTEND_URL=http://localhost:3000

# For production deployment, set FRONTEND_URL to your deployed frontend URL:
# FRONTEND_URL=https://rateflow-kappa.vercel.app

# Database
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=password
DB_NAME=yield_tracker

# Redis
REDIS_URL=redis://localhost:6379

# Blockchain
ETHEREUM_RPC_URL=https://eth-mainnet.alchemyapi.io/v2/YOUR_API_KEY
POLLING_INTERVAL=45000

# Logging
LOG_LEVEL=info
```

**Frontend (.env):**
```bash
REACT_APP_API_URL=http://localhost:3001
```

### 3. Start Services
```bash
# Start database and cache
docker-compose up -d

# Install dependencies
cd backend && npm install
cd ../frontend && npm install

# Start backend
cd backend && npm run dev

# Start frontend (in another terminal)
cd frontend && npm start
```

### 4. Initialize Database
```bash
cd backend
npm run db:migrate
```

---

## Production Deployment

### Option 1: Docker Deployment

#### 1. Create Production Docker Compose

**docker-compose.prod.yml:**
```yaml
version: '3.8'

services:
  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile.prod
    environment:
      - NODE_ENV=production
      - PORT=3001
      - DB_HOST=postgres
      - REDIS_URL=redis://redis:6379
      - ETHEREUM_RPC_URL=${ETHEREUM_RPC_URL}
    depends_on:
      - postgres
      - redis
    restart: unless-stopped
    networks:
      - app-network

  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile.prod
    environment:
      - REACT_APP_API_URL=${API_URL}
    restart: unless-stopped
    networks:
      - app-network

  postgres:
    image: postgres:15
    environment:
      POSTGRES_DB: yield_tracker
      POSTGRES_USER: ${DB_USER}
      POSTGRES_PASSWORD: ${DB_PASSWORD}
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./backend/migrations/001_create_tables.sql:/docker-entrypoint-initdb.d/001_create_tables.sql
    restart: unless-stopped
    networks:
      - app-network

  redis:
    image: redis:7-alpine
    command: redis-server --appendonly yes
    volumes:
      - redis_data:/data
    restart: unless-stopped
    networks:
      - app-network

  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf
      - ./ssl:/etc/nginx/ssl
    depends_on:
      - backend
      - frontend
    restart: unless-stopped
    networks:
      - app-network

volumes:
  postgres_data:
  redis_data:

networks:
  app-network:
    driver: bridge
```

#### 2. Create Dockerfiles

**backend/Dockerfile.prod:**
```dockerfile
FROM node:18-alpine AS builder

WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

COPY . .
RUN npm run build

FROM node:18-alpine AS runtime

WORKDIR /app
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/package.json ./

EXPOSE 3001

USER node

CMD ["node", "dist/index.js"]
```

**frontend/Dockerfile.prod:**
```dockerfile
FROM node:18-alpine AS builder

WORKDIR /app
COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

FROM nginx:alpine AS runtime

COPY --from=builder /app/build /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
```

#### 3. Nginx Configuration

**nginx.conf:**
```nginx
events {
    worker_connections 1024;
}

http {
    upstream backend {
        server backend:3001;
    }

    upstream frontend {
        server frontend:80;
    }

    # Frontend
    server {
        listen 80;
        server_name your-domain.com;

        location / {
            proxy_pass http://frontend;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
        }

        # API routes
        location /api/ {
            proxy_pass http://backend;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        }

        # WebSocket support
        location /socket.io/ {
            proxy_pass http://backend;
            proxy_http_version 1.1;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection "upgrade";
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
        }
    }

    # HTTPS redirect (if SSL is configured)
    server {
        listen 443 ssl;
        server_name your-domain.com;

        ssl_certificate /etc/nginx/ssl/cert.pem;
        ssl_certificate_key /etc/nginx/ssl/key.pem;

        location / {
            proxy_pass http://frontend;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
        }

        location /api/ {
            proxy_pass http://backend;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
        }

        location /socket.io/ {
            proxy_pass http://backend;
            proxy_http_version 1.1;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection "upgrade";
        }
    }
}
```

#### 4. Deploy
```bash
# Create production environment file
cat > .env.prod << EOF
ETHEREUM_RPC_URL=https://eth-mainnet.alchemyapi.io/v2/YOUR_PRODUCTION_KEY
DB_USER=postgres
DB_PASSWORD=your_secure_password
API_URL=https://your-domain.com
EOF

# Deploy
docker-compose -f docker-compose.prod.yml --env-file .env.prod up -d
```

### Option 2: Cloud Deployment (AWS)

#### 1. Infrastructure Setup

**Using AWS ECS with Fargate:**

```yaml
# ecs-task-definition.json
{
  "family": "yield-tracker",
  "networkMode": "awsvpc",
  "requiresCompatibilities": ["FARGATE"],
  "cpu": "1024",
  "memory": "2048",
  "executionRoleArn": "arn:aws:iam::account:role/ecsTaskExecutionRole",
  "taskRoleArn": "arn:aws:iam::account:role/ecsTaskRole",
  "containerDefinitions": [
    {
      "name": "backend",
      "image": "your-registry/yield-tracker-backend:latest",
      "portMappings": [
        {
          "containerPort": 3001,
          "protocol": "tcp"
        }
      ],
      "environment": [
        {
          "name": "NODE_ENV",
          "value": "production"
        },
        {
          "name": "DB_HOST",
          "value": "your-rds-endpoint"
        },
        {
          "name": "REDIS_URL",
          "value": "redis://your-elasticache-endpoint:6379"
        }
      ],
      "secrets": [
        {
          "name": "ETHEREUM_RPC_URL",
          "valueFrom": "arn:aws:secretsmanager:region:account:secret:ethereum-rpc-url"
        },
        {
          "name": "DB_PASSWORD",
          "valueFrom": "arn:aws:secretsmanager:region:account:secret:db-password"
        }
      ],
      "logConfiguration": {
        "logDriver": "awslogs",
        "options": {
          "awslogs-group": "/ecs/yield-tracker",
          "awslogs-region": "us-east-1",
          "awslogs-stream-prefix": "backend"
        }
      }
    }
  ]
}
```

#### 2. Database Setup (RDS)
```bash
# Create RDS PostgreSQL instance
aws rds create-db-instance \
  --db-instance-identifier yield-tracker-db \
  --db-instance-class db.t3.micro \
  --engine postgres \
  --engine-version 15.4 \
  --master-username postgres \
  --master-user-password your-secure-password \
  --allocated-storage 20 \
  --vpc-security-group-ids sg-xxxxxxxxx \
  --db-subnet-group-name your-subnet-group
```

#### 3. Cache Setup (ElastiCache)
```bash
# Create Redis cluster
aws elasticache create-cache-cluster \
  --cache-cluster-id yield-tracker-redis \
  --cache-node-type cache.t3.micro \
  --engine redis \
  --num-cache-nodes 1 \
  --security-group-ids sg-xxxxxxxxx \
  --subnet-group-name your-cache-subnet-group
```

#### 4. Load Balancer Setup
```bash
# Create Application Load Balancer
aws elbv2 create-load-balancer \
  --name yield-tracker-alb \
  --subnets subnet-xxxxxxxx subnet-yyyyyyyy \
  --security-groups sg-xxxxxxxxx
```

### Option 3: Kubernetes Deployment

#### 1. Kubernetes Manifests

**k8s/namespace.yaml:**
```yaml
apiVersion: v1
kind: Namespace
metadata:
  name: yield-tracker
```

**k8s/backend-deployment.yaml:**
```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: backend
  namespace: yield-tracker
spec:
  replicas: 3
  selector:
    matchLabels:
      app: backend
  template:
    metadata:
      labels:
        app: backend
    spec:
      containers:
      - name: backend
        image: your-registry/yield-tracker-backend:latest
        ports:
        - containerPort: 3001
        env:
        - name: NODE_ENV
          value: "production"
        - name: DB_HOST
          value: "postgres-service"
        - name: REDIS_URL
          value: "redis://redis-service:6379"
        envFrom:
        - secretRef:
            name: app-secrets
        resources:
          requests:
            memory: "256Mi"
            cpu: "250m"
          limits:
            memory: "512Mi"
            cpu: "500m"
        livenessProbe:
          httpGet:
            path: /health
            port: 3001
          initialDelaySeconds: 30
          periodSeconds: 10
        readinessProbe:
          httpGet:
            path: /health
            port: 3001
          initialDelaySeconds: 5
          periodSeconds: 5
```

**k8s/frontend-deployment.yaml:**
```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: frontend
  namespace: yield-tracker
spec:
  replicas: 2
  selector:
    matchLabels:
      app: frontend
  template:
    metadata:
      labels:
        app: frontend
    spec:
      containers:
      - name: frontend
        image: your-registry/yield-tracker-frontend:latest
        ports:
        - containerPort: 80
        resources:
          requests:
            memory: "128Mi"
            cpu: "100m"
          limits:
            memory: "256Mi"
            cpu: "200m"
```

#### 2. Services and Ingress

**k8s/services.yaml:**
```yaml
apiVersion: v1
kind: Service
metadata:
  name: backend-service
  namespace: yield-tracker
spec:
  selector:
    app: backend
  ports:
  - port: 3001
    targetPort: 3001
  type: ClusterIP

---
apiVersion: v1
kind: Service
metadata:
  name: frontend-service
  namespace: yield-tracker
spec:
  selector:
    app: frontend
  ports:
  - port: 80
    targetPort: 80
  type: ClusterIP
```

**k8s/ingress.yaml:**
```yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: yield-tracker-ingress
  namespace: yield-tracker
  annotations:
    kubernetes.io/ingress.class: nginx
    cert-manager.io/cluster-issuer: letsencrypt-prod
spec:
  tls:
  - hosts:
    - your-domain.com
    secretName: yield-tracker-tls
  rules:
  - host: your-domain.com
    http:
      paths:
      - path: /api
        pathType: Prefix
        backend:
          service:
            name: backend-service
            port:
              number: 3001
      - path: /socket.io
        pathType: Prefix
        backend:
          service:
            name: backend-service
            port:
              number: 3001
      - path: /
        pathType: Prefix
        backend:
          service:
            name: frontend-service
            port:
              number: 80
```

#### 3. Deploy to Kubernetes
```bash
# Apply manifests
kubectl apply -f k8s/

# Check deployment status
kubectl get pods -n yield-tracker
kubectl get services -n yield-tracker
kubectl get ingress -n yield-tracker
```

---

## Environment Configuration

### Production Environment Variables

**Backend:**
```bash
NODE_ENV=production
PORT=3001
LOG_LEVEL=warn

# Database
DB_HOST=your-db-host
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=your-secure-password
DB_NAME=yield_tracker

# Redis
REDIS_URL=redis://your-redis-host:6379

# Blockchain
ETHEREUM_RPC_URL=https://eth-mainnet.alchemyapi.io/v2/YOUR_PRODUCTION_KEY
POLLING_INTERVAL=60000

# Security
FRONTEND_URL=https://your-domain.com

# CORS Configuration
# The backend automatically allows both localhost (development) and the FRONTEND_URL (production)
# For multiple frontend URLs, update the allowedOrigins array in backend/src/index.ts
```

**Frontend:**
```bash
REACT_APP_API_URL=https://your-domain.com
```

---

## Monitoring and Logging

### 1. Application Monitoring

**Health Check Endpoints:**
- Backend: `GET /health`
- API Status: `GET /api/v1/yields/status`

**Monitoring Stack:**
```yaml
# docker-compose.monitoring.yml
version: '3.8'

services:
  prometheus:
    image: prom/prometheus
    ports:
      - "9090:9090"
    volumes:
      - ./prometheus.yml:/etc/prometheus/prometheus.yml

  grafana:
    image: grafana/grafana
    ports:
      - "3000:3000"
    environment:
      - GF_SECURITY_ADMIN_PASSWORD=admin
    volumes:
      - grafana_data:/var/lib/grafana

volumes:
  grafana_data:
```

### 2. Log Management

**Centralized Logging with ELK Stack:**
```yaml
# docker-compose.logging.yml
version: '3.8'

services:
  elasticsearch:
    image: docker.elastic.co/elasticsearch/elasticsearch:8.5.0
    environment:
      - discovery.type=single-node
      - xpack.security.enabled=false
    ports:
      - "9200:9200"

  kibana:
    image: docker.elastic.co/kibana/kibana:8.5.0
    ports:
      - "5601:5601"
    depends_on:
      - elasticsearch

  logstash:
    image: docker.elastic.co/logstash/logstash:8.5.0
    volumes:
      - ./logstash.conf:/usr/share/logstash/pipeline/logstash.conf
    depends_on:
      - elasticsearch
```

---

## Security Considerations

### 1. Environment Security
- Use secrets management (AWS Secrets Manager, Kubernetes Secrets)
- Rotate API keys regularly
- Use strong database passwords
- Enable SSL/TLS for all connections

### 2. Network Security
- Use VPC/private networks
- Configure security groups/firewalls
- Enable DDoS protection
- Use WAF for web application firewall

### 3. Application Security
- Rate limiting (already implemented)
- Input validation
- CORS configuration
- Security headers (Helmet.js)

---

## Backup and Recovery

### 1. Database Backup
```bash
# Automated backup script
#!/bin/bash
BACKUP_DIR="/backups"
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="yield_tracker_backup_$DATE.sql"

pg_dump -h $DB_HOST -U $DB_USER -d yield_tracker > $BACKUP_DIR/$BACKUP_FILE

# Upload to S3 (optional)
aws s3 cp $BACKUP_DIR/$BACKUP_FILE s3://your-backup-bucket/database/
```

### 2. Redis Backup
```bash
# Redis backup
redis-cli --rdb /backups/redis_backup_$(date +%Y%m%d_%H%M%S).rdb
```

---

## Scaling Considerations

### 1. Horizontal Scaling
- Multiple backend instances behind load balancer
- Database read replicas
- Redis clustering
- CDN for frontend assets

### 2. Performance Optimization
- Database indexing
- Query optimization
- Caching strategies
- Connection pooling

### 3. Auto-scaling
```yaml
# Kubernetes HPA
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: backend-hpa
  namespace: yield-tracker
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: backend
  minReplicas: 2
  maxReplicas: 10
  metrics:
  - type: Resource
    resource:
      name: cpu
      target:
        type: Utilization
        averageUtilization: 70
```

---

## Troubleshooting

### Common Issues

1. **Database Connection Failed**
   - Check connection string
   - Verify network connectivity
   - Check database credentials

2. **RPC Provider Issues**
   - Verify API key
   - Check rate limits
   - Monitor RPC provider status

3. **WebSocket Connection Issues**
   - Check proxy configuration
   - Verify CORS settings
   - Check firewall rules

### Debug Commands
```bash
# Check container logs
docker logs yield-tracker-backend

# Check Kubernetes pods
kubectl logs -f deployment/backend -n yield-tracker

# Test API endpoints
curl https://your-domain.com/api/v1/health
curl https://your-domain.com/api/v1/yields/status
```

This deployment guide provides comprehensive instructions for deploying the Web3 Yield Tracker platform in various environments, from local development to production cloud deployments.