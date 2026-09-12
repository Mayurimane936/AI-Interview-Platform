# backend/app/data/technical_topics.py

"""
Central catalogue of supported technical interview topics.

This file is the source of truth for:
- Interview category selection
- Topic validation
- Custom topic validation
- Future topic search
- Future aliases / autocomplete

IMPORTANT:
- Keep category keys stable because they may be stored in the database.
- Keep topic names lowercase for easier normalization.
- Add aliases separately instead of duplicating topics.
"""

# ============================================================
# TECHNICAL TOPICS
# ============================================================

TECHNICAL_TOPICS = {

    # ========================================================
    # 1. DATA STRUCTURES & ALGORITHMS
    # ========================================================

    "dsa": {

        # Arrays / Strings
        "arrays",
        "strings",
        "two pointers",
        "sliding window",
        "prefix sum",
        "difference array",
        "kadane's algorithm",

        # Linked Lists
        "linked lists",
        "singly linked list",
        "doubly linked list",
        "circular linked list",
        "fast and slow pointers",

        # Stack / Queue
        "stacks",
        "queues",
        "deque",
        "monotonic stack",
        "monotonic queue",

        # Hashing
        "hash tables",
        "hash maps",
        "hash sets",
        "hash functions",
        "collision resolution",
        "separate chaining",
        "open addressing",

        # Trees
        "trees",
        "binary trees",
        "binary search trees",
        "avl trees",
        "red black trees",
        "b trees",
        "b+ trees",
        "segment trees",
        "fenwick trees",
        "binary indexed trees",
        "interval trees",
        "expression trees",
        "syntax trees",
        "tries",
        "prefix trees",
        "suffix trees",

        # Heaps
        "heaps",
        "min heap",
        "max heap",
        "priority queue",
        "heap sort",

        # Graphs
        "graphs",
        "graph representation",
        "bfs",
        "dfs",
        "topological sorting",
        "cycle detection",
        "connected components",
        "strongly connected components",
        "bridges",
        "articulation points",
        "bipartite graphs",
        "minimum spanning tree",
        "kruskal's algorithm",
        "prim's algorithm",

        # Shortest Path
        "shortest path",
        "dijkstra's algorithm",
        "bellman ford algorithm",
        "floyd warshall algorithm",
        "a star algorithm",

        # Searching
        "linear search",
        "binary search",
        "ternary search",
        "search in rotated array",
        "binary search on answer",

        # Sorting
        "sorting",
        "bubble sort",
        "selection sort",
        "insertion sort",
        "merge sort",
        "quick sort",
        "heap sort",
        "counting sort",
        "radix sort",
        "bucket sort",

        # Recursion
        "recursion",
        "backtracking",
        "divide and conquer",

        # Dynamic Programming
        "dynamic programming",
        "memoization",
        "tabulation",
        "knapsack",
        "0/1 knapsack",
        "unbounded knapsack",
        "coin change",
        "longest common subsequence",
        "longest increasing subsequence",
        "edit distance",
        "matrix chain multiplication",
        "interval dp",
        "tree dp",
        "bitmask dp",

        # Greedy
        "greedy algorithms",
        "activity selection",
        "fractional knapsack",
        "job sequencing",

        # Advanced
        "bit manipulation",
        "bitmasking",
        "bitwise operations",
        "xor tricks",
        "mathematical algorithms",
        "number theory",
        "prime numbers",
        "sieve of eratosthenes",
        "gcd",
        "lcm",
        "modular arithmetic",
        "combinatorics",
        "probability",
        "coordinate compression",
        "union find",
        "disjoint set union",
        "ordered sets",
        "sparse tables",
        "offline queries",
        "line sweep",
        "meet in the middle",
        "randomized algorithms",
    },


    # ========================================================
    # 2. OPERATING SYSTEMS
    # ========================================================

    "operating_systems": {

        # Processes / Threads
        "processes",
        "process management",
        "process states",
        "process scheduling",
        "process synchronization",
        "threads",
        "multithreading",
        "multithreading models",
        "user threads",
        "kernel threads",
        "context switching",

        # CPU Scheduling
        "cpu scheduling",
        "first come first serve",
        "shortest job first",
        "shortest remaining time first",
        "round robin scheduling",
        "priority scheduling",
        "multilevel queue scheduling",
        "multilevel feedback queue",

        # Concurrency
        "concurrency",
        "parallelism",
        "race conditions",
        "critical section",
        "mutex",
        "semaphore",
        "binary semaphore",
        "counting semaphore",
        "spinlock",
        "read write locks",
        "atomic operations",
        "deadlocks",
        "deadlock prevention",
        "deadlock avoidance",
        "deadlock detection",
        "banker's algorithm",

        # Memory
        "memory management",
        "virtual memory",
        "physical memory",
        "paging",
        "segmentation",
        "page tables",
        "multi level page tables",
        "tlb",
        "page replacement",
        "fifo page replacement",
        "lru page replacement",
        "optimal page replacement",
        "thrashing",
        "memory fragmentation",
        "internal fragmentation",
        "external fragmentation",
        "heap memory",
        "stack memory",

        # Storage / File Systems
        "file systems",
        "file allocation",
        "file permissions",
        "inodes",
        "disk scheduling",
        "disk management",
        "raid",
        "journaling file systems",

        # OS Internals
        "system calls",
        "kernel",
        "user mode",
        "kernel mode",
        "interrupts",
        "interrupt handling",
        "system boot process",
        "ipc",
        "inter process communication",
        "pipes",
        "named pipes",
        "message queues",
        "shared memory",

        # Misc
        "unix",
        "linux",
        "linux kernel",
        "process signals",
        "environment variables",
        "shell",
        "system utilities",
    },


    # ========================================================
    # 3. DBMS / DATABASES
    # ========================================================

    "dbms": {

        # Fundamentals
        "database fundamentals",
        "relational databases",
        "database schemas",
        "tables",
        "rows and columns",
        "primary keys",
        "foreign keys",
        "candidate keys",
        "composite keys",
        "constraints",

        # SQL
        "sql",
        "select queries",
        "where clause",
        "group by",
        "having clause",
        "order by",
        "joins",
        "inner join",
        "left join",
        "right join",
        "full outer join",
        "cross join",
        "self join",
        "subqueries",
        "correlated subqueries",
        "common table expressions",
        "cte",
        "recursive cte",
        "window functions",
        "aggregate functions",
        "sql functions",
        "stored procedures",
        "triggers",
        "views",

        # Design
        "database design",
        "normalization",
        "first normal form",
        "second normal form",
        "third normal form",
        "boyce codd normal form",
        "denormalization",
        "entity relationship modeling",
        "er diagrams",
        "data modeling",

        # Transactions
        "transactions",
        "acid",
        "atomicity",
        "consistency",
        "isolation",
        "durability",
        "transaction isolation levels",
        "read committed",
        "repeatable read",
        "serializable isolation",
        "dirty reads",
        "non repeatable reads",
        "phantom reads",
        "locking",
        "two phase locking",
        "optimistic concurrency control",
        "pessimistic locking",

        # Indexes
        "database indexes",
        "b tree indexes",
        "b+ tree indexes",
        "hash indexes",
        "clustered indexes",
        "non clustered indexes",
        "composite indexes",
        "covering indexes",
        "index selectivity",
        "query optimization",
        "query execution plans",

        # Advanced
        "database partitioning",
        "database replication",
        "database sharding",
        "read replicas",
        "write replicas",
        "connection pooling",
        "database migrations",
        "database locking",
        "deadlocks in databases",
        "mvcc",
    },


    # ========================================================
    # 4. NOSQL / DISTRIBUTED DATABASES
    # ========================================================

    "nosql": {

        "nosql databases",
        "document databases",
        "key value databases",
        "column databases",
        "wide column stores",
        "graph databases",

        # MongoDB
        "mongodb",
        "mongodb collections",
        "mongodb indexes",
        "mongodb aggregation",
        "mongodb transactions",
        "mongodb replication",
        "mongodb sharding",

        # Redis
        "redis",
        "redis strings",
        "redis lists",
        "redis sets",
        "redis sorted sets",
        "redis hashes",
        "redis ttl",
        "redis expiration",
        "redis pub sub",
        "redis streams",
        "redis transactions",
        "redis persistence",
        "redis clustering",
        "redis sentinel",

        # Dynamo / Cassandra
        "dynamodb",
        "dynamodb partition keys",
        "dynamodb sort keys",
        "dynamodb secondary indexes",
        "dynamodb streams",
        "cassandra",
        "cassandra partitioning",
        "cassandra consistency",
        "cassandra replication",

        # Distributed concepts
        "eventual consistency",
        "strong consistency",
        "quorum",
        "consistent hashing",
        "cap theorem",
        "pacelc theorem",
    },


    # ========================================================
    # 5. COMPUTER NETWORKS
    # ========================================================

    "computer_networks": {

        # Fundamentals
        "computer networks",
        "networking fundamentals",
        "network topologies",
        "lan",
        "wan",
        "man",
        "network devices",

        # OSI / TCP-IP
        "osi model",
        "tcp ip model",
        "application layer",
        "transport layer",
        "network layer",
        "data link layer",
        "physical layer",

        # Protocols
        "tcp",
        "udp",
        "ip",
        "ipv4",
        "ipv6",
        "icmp",
        "arp",
        "dhcp",
        "dns",
        "http",
        "https",
        "http/1.1",
        "http/2",
        "http/3",
        "quic",
        "ftp",
        "smtp",
        "pop3",
        "imap",
        "ssh",
        "telnet",
        "websocket",

        # TCP
        "tcp handshake",
        "tcp three way handshake",
        "tcp connection termination",
        "tcp flow control",
        "tcp congestion control",
        "tcp slow start",
        "tcp retransmission",
        "tcp sliding window",

        # Routing
        "routing",
        "routing tables",
        "static routing",
        "dynamic routing",
        "distance vector routing",
        "link state routing",
        "bgp",
        "ospf",
        "rip",

        # Network concepts
        "ports",
        "sockets",
        "ip addressing",
        "subnetting",
        "cidr",
        "nat",
        "proxy",
        "reverse proxy",
        "vpn",
        "firewalls",
        "load balancing",
        "packet switching",
        "circuit switching",
        "network latency",
        "network throughput",
        "bandwidth",
        "network congestion",
    },


    # ========================================================
    # 6. BACKEND DEVELOPMENT
    # ========================================================

    "backend": {

        # API
        "backend development",
        "rest apis",
        "rest architecture",
        "api design",
        "api versioning",
        "api gateways",
        "graphql",
        "grpc",
        "webhooks",
        "websockets",
        "server sent events",

        # HTTP
        "http methods",
        "http status codes",
        "http headers",
        "http cookies",
        "http sessions",
        "http caching",
        "content negotiation",
        "cors",

        # Authentication
        "authentication",
        "authorization",
        "session based authentication",
        "token based authentication",
        "jwt",
        "oauth",
        "oauth 2.0",
        "openid connect",
        "saml",
        "api keys",
        "access tokens",
        "refresh tokens",
        "rbac",
        "abac",

        # Backend architecture
        "monolithic architecture",
        "modular monolith",
        "microservices",
        "service oriented architecture",
        "event driven architecture",
        "layered architecture",
        "clean architecture",
        "hexagonal architecture",
        "dependency injection",
        "middleware",

        # Async / Jobs
        "background jobs",
        "task queues",
        "job queues",
        "rq",
        "celery",
        "worker processes",
        "cron jobs",
        "scheduled jobs",

        # Messaging
        "message queues",
        "pub sub",
        "event streaming",
        "kafka",
        "rabbitmq",
        "nats",
        "amazon sqs",
        "amazon sns",

        # Performance
        "backend performance",
        "connection pooling",
        "caching",
        "rate limiting",
        "request throttling",
        "pagination",
        "cursor pagination",
        "batch processing",
        "load shedding",

        # Reliability
        "health checks",
        "readiness probes",
        "liveness probes",
        "timeouts",
        "retries",
        "exponential backoff",
        "circuit breaker",
        "bulkheads",
        "idempotency",
        "graceful shutdown",
    },


    # ========================================================
    # 7. SYSTEM DESIGN
    # ========================================================

    "system_design": {

        # Basics
        "system design",
        "high level design",
        "low level design",
        "requirements gathering",
        "functional requirements",
        "non functional requirements",
        "scalability",
        "availability",
        "reliability",
        "maintainability",

        # Architecture
        "distributed systems",
        "microservices",
        "monolith",
        "service oriented architecture",
        "event driven architecture",
        "client server architecture",
        "peer to peer architecture",

        # Scaling
        "horizontal scaling",
        "vertical scaling",
        "auto scaling",
        "load balancing",
        "reverse proxy",
        "api gateway",
        "service discovery",

        # Caching
        "caching",
        "cache aside",
        "read through cache",
        "write through cache",
        "write back cache",
        "cache invalidation",
        "cache eviction",
        "lru cache",
        "distributed caching",

        # Databases
        "database scaling",
        "database replication",
        "database sharding",
        "database partitioning",
        "read replicas",
        "database federation",
        "consistent hashing",

        # Distributed systems
        "distributed systems",
        "consistency models",
        "strong consistency",
        "eventual consistency",
        "consensus",
        "raft",
        "paxos",
        "leader election",
        "distributed locks",
        "distributed transactions",
        "two phase commit",
        "sagas",
        "idempotency",

        # Messaging
        "message queues",
        "event streaming",
        "kafka",
        "rabbitmq",
        "pub sub",
        "dead letter queues",
        "message ordering",
        "at least once delivery",
        "at most once delivery",
        "exactly once semantics",

        # Reliability
        "fault tolerance",
        "disaster recovery",
        "backup strategies",
        "failover",
        "redundancy",
        "replication",
        "graceful degradation",
        "retry mechanisms",
        "circuit breakers",
        "rate limiting",

        # Observability
        "observability",
        "logging",
        "metrics",
        "tracing",
        "distributed tracing",
        "monitoring",
        "alerting",

        # Storage
        "object storage",
        "blob storage",
        "file storage",
        "block storage",
        "content delivery network",
        "cdn",
    },


    # ========================================================
    # 8. SOFTWARE ENGINEERING
    # ========================================================

    "software_engineering": {

        "software development lifecycle",
        "requirements engineering",
        "software requirements",
        "software architecture",
        "software design",
        "code quality",
        "code review",
        "technical debt",
        "refactoring",
        "version control",
        "git",
        "github",
        "git branching",
        "git merge",
        "git rebase",
        "git cherry pick",
        "git reset",
        "git revert",
        "pull requests",
        "continuous integration",
        "continuous delivery",
        "continuous deployment",
        "ci cd",
        "release management",
        "semantic versioning",
        "feature flags",
        "configuration management",
        "documentation",
        "api documentation",
        "technical documentation",
    },


    # ========================================================
    # 9. OBJECT ORIENTED PROGRAMMING / LLD
    # ========================================================

    "oop_lld": {

        # OOP
        "object oriented programming",
        "classes",
        "objects",
        "encapsulation",
        "inheritance",
        "polymorphism",
        "abstraction",
        "composition",
        "aggregation",
        "association",
        "method overloading",
        "method overriding",
        "virtual functions",
        "abstract classes",
        "interfaces",
        "multiple inheritance",

        # SOLID
        "solid principles",
        "single responsibility principle",
        "open closed principle",
        "liskov substitution principle",
        "interface segregation principle",
        "dependency inversion principle",

        # Design patterns
        "design patterns",
        "factory pattern",
        "abstract factory",
        "builder pattern",
        "singleton pattern",
        "prototype pattern",
        "adapter pattern",
        "bridge pattern",
        "composite pattern",
        "decorator pattern",
        "facade pattern",
        "flyweight pattern",
        "proxy pattern",
        "chain of responsibility",
        "command pattern",
        "iterator pattern",
        "mediator pattern",
        "memento pattern",
        "observer pattern",
        "state pattern",
        "strategy pattern",
        "template method pattern",
        "visitor pattern",

        # Design
        "class design",
        "object relationships",
        "dependency injection",
        "coupling",
        "cohesion",
        "immutability",
        "interface design",
        "extensibility",
    },


    # ========================================================
    # 10. C / C++
    # ========================================================

    "cpp": {

        "c programming",
        "c++ programming",
        "c++ basics",
        "pointers",
        "references",
        "memory management",
        "stack vs heap",
        "dynamic memory allocation",
        "smart pointers",
        "unique_ptr",
        "shared_ptr",
        "weak_ptr",
        "raii",
        "constructors",
        "destructors",
        "copy constructor",
        "move constructor",
        "copy assignment",
        "move semantics",
        "rule of three",
        "rule of five",
        "rule of zero",
        "templates",
        "function templates",
        "class templates",
        "template specialization",
        "stl",
        "vector",
        "list",
        "deque",
        "stack",
        "queue",
        "priority_queue",
        "set",
        "unordered_set",
        "map",
        "unordered_map",
        "iterators",
        "lambda expressions",
        "function objects",
        "exceptions",
        "operator overloading",
        "virtual functions",
        "pure virtual functions",
        "vtable",
        "namespaces",
        "const correctness",
        "static keyword",
        "friend functions",
        "multiple inheritance",
        "diamond problem",
        "move semantics",
        "perfect forwarding",
        "rvalue references",
        "multithreading in c++",
        "mutex in c++",
        "thread in c++",
        "atomic operations in c++",
    },


    # ========================================================
    # 11. JAVA
    # ========================================================

    "java": {

        "java",
        "java basics",
        "jvm",
        "jre",
        "jdk",
        "java memory model",
        "garbage collection",
        "java garbage collector",
        "generics",
        "collections framework",
        "arraylist",
        "linkedlist",
        "hashmap",
        "hashset",
        "concurrenthashmap",
        "streams",
        "lambda expressions",
        "functional interfaces",
        "exceptions",
        "checked exceptions",
        "unchecked exceptions",
        "multithreading",
        "java threads",
        "synchronization",
        "executor service",
        "futures",
        "completablefuture",
        "reflection",
        "annotations",
        "serialization",
        "spring",
        "spring boot",
        "spring mvc",
        "spring security",
        "hibernate",
        "jpa",
        "jdbc",
    },


    # ========================================================
    # 12. PYTHON
    # ========================================================

    "python": {

        "python",
        "python basics",
        "python data types",
        "lists",
        "tuples",
        "sets",
        "dictionaries",
        "list comprehensions",
        "dictionary comprehensions",
        "generators",
        "iterators",
        "decorators",
        "context managers",
        "lambda functions",
        "closures",
        "python functions",
        "python classes",
        "inheritance in python",
        "dunder methods",
        "magic methods",
        "exception handling",
        "python modules",
        "python packages",
        "virtual environments",
        "pip",
        "asyncio",
        "async await",
        "python threading",
        "python multiprocessing",
        "gil",
        "memory management in python",
        "garbage collection in python",
        "type hints",
        "dataclasses",
        "pydantic",
        "pytest",
    },


    # ========================================================
    # 13. JAVASCRIPT / TYPESCRIPT
    # ========================================================

    "javascript_typescript": {

        "javascript",
        "typescript",
        "javascript basics",
        "typescript basics",
        "variables",
        "closures",
        "scope",
        "lexical scope",
        "hoisting",
        "prototypes",
        "prototype chain",
        "this keyword",
        "event loop",
        "call stack",
        "microtasks",
        "macrotasks",
        "promises",
        "async await",
        "callbacks",
        "fetch api",
        "dom",
        "browser storage",
        "local storage",
        "session storage",
        "cookies",
        "modules",
        "es modules",
        "commonjs",
        "npm",
        "package management",
        "typescript types",
        "typescript interfaces",
        "typescript generics",
        "typescript utility types",
        "typescript decorators",
    },


    # ========================================================
    # 14. FRONTEND
    # ========================================================

    "frontend": {

        "frontend development",
        "html",
        "html5",
        "css",
        "css3",
        "responsive design",
        "flexbox",
        "css grid",
        "css positioning",
        "css selectors",
        "css specificity",
        "css animations",
        "css transitions",
        "tailwind css",
        "javascript",
        "typescript",
        "dom manipulation",
        "browser rendering",
        "browser storage",
        "cookies",
        "web accessibility",
        "aria",
        "seo",
        "web performance",
        "lazy loading",
        "code splitting",
        "browser caching",
        "content security policy",
        "cross origin policies",
    },


    # ========================================================
    # 15. REACT
    # ========================================================

    "react": {

        "react",
        "react components",
        "jsx",
        "props",
        "state",
        "hooks",
        "use state",
        "use effect",
        "use context",
        "use reducer",
        "use memo",
        "use callback",
        "use ref",
        "custom hooks",
        "react router",
        "react query",
        "state management",
        "redux",
        "redux toolkit",
        "context api",
        "component lifecycle",
        "controlled components",
        "uncontrolled components",
        "forms in react",
        "error boundaries",
        "react performance",
        "memoization in react",
        "server side rendering",
        "static site generation",
        "next.js",
    },


    # ========================================================
    # 16. CLOUD / AWS
    # ========================================================

    "cloud": {

        # Cloud fundamentals
        "cloud computing",
        "iaas",
        "paas",
        "saas",
        "public cloud",
        "private cloud",
        "hybrid cloud",
        "multi cloud",
        "serverless computing",

        # AWS
        "aws",
        "aws ec2",
        "aws s3",
        "aws lambda",
        "aws api gateway",
        "aws rds",
        "aws dynamodb",
        "aws elasticache",
        "aws sqs",
        "aws sns",
        "aws cloudwatch",
        "aws iam",
        "aws vpc",
        "aws route 53",
        "aws cloudfront",
        "aws ecs",
        "aws eks",
        "aws ecr",
        "aws fargate",
        "aws autoscaling",
        "aws load balancer",
        "aws alb",
        "aws nlb",

        # General cloud
        "cloud networking",
        "cloud security",
        "cloud storage",
        "cloud databases",
        "cloud monitoring",
        "cloud cost optimization",
        "cloud scalability",
        "cloud availability",
    },


    # ========================================================
    # 17. DEVOPS
    # ========================================================

    "devops": {

        "devops",
        "ci cd",
        "continuous integration",
        "continuous delivery",
        "continuous deployment",
        "build pipelines",
        "deployment strategies",
        "blue green deployment",
        "canary deployment",
        "rolling deployment",
        "infrastructure as code",
        "configuration management",
        "secrets management",

        # Docker
        "docker",
        "docker images",
        "docker containers",
        "dockerfile",
        "docker volumes",
        "docker networks",
        "docker compose",
        "containerization",

        # Kubernetes
        "kubernetes",
        "k8s",
        "pods",
        "deployments",
        "services in kubernetes",
        "configmaps",
        "secrets in kubernetes",
        "ingress",
        "statefulsets",
        "daemonsets",
        "replicasets",
        "horizontal pod autoscaler",
        "helm",
        "kubernetes networking",

        # Terraform
        "terraform",
        "terraform modules",
        "terraform state",
        "terraform providers",

        # Linux / automation
        "linux administration",
        "shell scripting",
        "bash scripting",
        "cron",
        "process monitoring",
        "system monitoring",
    },


    # ========================================================
    # 18. SECURITY
    # ========================================================

    "security": {

        # Fundamentals
        "cybersecurity",
        "application security",
        "information security",
        "network security",
        "security fundamentals",
        "threat modeling",
        "risk assessment",
        "security architecture",

        # Web Security
        "web security",
        "owasp",
        "owasp top 10",
        "sql injection",
        "cross site scripting",
        "xss",
        "cross site request forgery",
        "csrf",
        "server side request forgery",
        "ssrf",
        "command injection",
        "path traversal",
        "file inclusion",
        "insecure deserialization",
        "security misconfiguration",

        # Identity
        "authentication",
        "authorization",
        "identity management",
        "iam",
        "oauth",
        "oauth 2.0",
        "openid connect",
        "saml",
        "jwt",
        "rbac",
        "abac",
        "mfa",
        "password security",

        # Cryptography
        "cryptography",
        "symmetric encryption",
        "asymmetric encryption",
        "hashing",
        "digital signatures",
        "public key infrastructure",
        "pki",
        "tls",
        "ssl",
        "certificates",
        "key management",

        # Network Security
        "firewalls",
        "waf",
        "ids",
        "ips",
        "vpn",
        "network segmentation",
        "zero trust",
        "ddos",
        "rate limiting",

        # DevSecOps
        "devsecops",
        "secure coding",
        "dependency scanning",
        "secret scanning",
        "static application security testing",
        "sast",
        "dynamic application security testing",
        "dast",
        "software composition analysis",
        "sca",
        "container security",

        # Browser security
        "content security policy",
        "same origin policy",
        "cors security",
        "browser security",
        "clickjacking",
        "typosquatting",
        "phishing",
        "data loss prevention",
        "dlp",
    },


    # ========================================================
    # 19. AI / MACHINE LEARNING
    # ========================================================

    "ai_ml": {

        # AI fundamentals
        "artificial intelligence",
        "machine learning",
        "deep learning",
        "supervised learning",
        "unsupervised learning",
        "semi supervised learning",
        "reinforcement learning",

        # ML Algorithms
        "linear regression",
        "logistic regression",
        "decision trees",
        "random forests",
        "gradient boosting",
        "xgboost",
        "lightgbm",
        "support vector machines",
        "knn",
        "k means",
        "hierarchical clustering",
        "pca",
        "dimensionality reduction",

        # ML concepts
        "feature engineering",
        "feature selection",
        "model evaluation",
        "cross validation",
        "overfitting",
        "underfitting",
        "bias variance tradeoff",
        "regularization",
        "hyperparameter tuning",
        "precision",
        "recall",
        "f1 score",
        "roc auc",
        "confusion matrix",

        # Deep Learning
        "neural networks",
        "deep neural networks",
        "cnn",
        "rnn",
        "lstm",
        "gru",
        "transformers",
        "attention mechanism",

        # NLP
        "natural language processing",
        "tokenization",
        "embeddings",
        "word embeddings",
        "text classification",
        "named entity recognition",
        "sentiment analysis",

        # Generative AI
        "generative ai",
        "large language models",
        "llms",
        "prompt engineering",
        "retrieval augmented generation",
        "rag",
        "vector databases",
        "semantic search",
        "ai agents",
        "function calling",
        "model fine tuning",
        "rlhf",
        "multimodal ai",
    },


    # ========================================================
    # 20. SOFTWARE TESTING
    # ========================================================

    "testing": {

        "software testing",
        "testing fundamentals",
        "unit testing",
        "integration testing",
        "system testing",
        "end to end testing",
        "acceptance testing",
        "regression testing",
        "smoke testing",
        "sanity testing",
        "performance testing",
        "load testing",
        "stress testing",
        "security testing",
        "test driven development",
        "tdd",
        "behavior driven development",
        "bdd",
        "mocking",
        "test doubles",
        "test fixtures",
        "test coverage",
        "property based testing",
        "contract testing",
        "api testing",
        "pytest",
        "junit",
        "jest",
        "playwright",
        "selenium",
    },


    # ========================================================
    # 21. SOFTWARE ARCHITECTURE
    # ========================================================

    "architecture": {

        "software architecture",
        "architectural patterns",
        "layered architecture",
        "clean architecture",
        "hexagonal architecture",
        "ports and adapters",
        "onion architecture",
        "microservices architecture",
        "monolithic architecture",
        "modular monolith",
        "event driven architecture",
        "serverless architecture",
        "service oriented architecture",
        "domain driven design",
        "ddd",
        "bounded contexts",
        "aggregate roots",
        "cqrs",
        "event sourcing",
        "repository pattern",
        "unit of work pattern",
        "dependency injection",
        "inversion of control",
        "separation of concerns",
        "loose coupling",
        "high cohesion",
    },


    # ========================================================
    # 22. LINUX / UNIX
    # ========================================================

    "linux": {

        "linux",
        "unix",
        "linux commands",
        "bash",
        "shell scripting",
        "processes in linux",
        "signals",
        "file permissions",
        "users and groups",
        "sudo",
        "ssh",
        "scp",
        "grep",
        "awk",
        "sed",
        "curl",
        "wget",
        "ps",
        "top",
        "htop",
        "lsof",
        "netstat",
        "ss",
        "systemd",
        "cron",
        "crontab",
        "environment variables",
        "pipes",
        "redirection",
        "file descriptors",
        "inode",
        "mounting",
        "linux networking",
        "linux memory management",
        "linux process scheduling",
    },


    # ========================================================
    # 23. GIT / VERSION CONTROL
    # ========================================================

    "git": {

        "git",
        "version control",
        "git repository",
        "git commits",
        "git branches",
        "git merge",
        "git rebase",
        "git cherry pick",
        "git stash",
        "git reset",
        "git revert",
        "git fetch",
        "git pull",
        "git push",
        "git clone",
        "git tags",
        "git hooks",
        "git workflows",
        "gitflow",
        "github",
        "pull requests",
        "merge conflicts",
        "commit history",
    },


    # ========================================================
    # 24. SYSTEM PROGRAMMING
    # ========================================================

    "system_programming": {

        "system programming",
        "memory management",
        "pointers",
        "process creation",
        "fork",
        "exec",
        "signals",
        "system calls",
        "file descriptors",
        "ipc",
        "pipes",
        "shared memory",
        "sockets",
        "multithreading",
        "mutex",
        "semaphore",
        "atomic operations",
        "thread pools",
        "memory mapped files",
        "dynamic linking",
        "static linking",
        "compilers",
        "linkers",
        "loaders",
    },


    # ========================================================
    # 25. COMPILERS / LANGUAGES
    # ========================================================

    "compilers": {

        "compiler design",
        "compiler phases",
        "lexical analysis",
        "lexical analyzer",
        "parsing",
        "parser",
        "syntax analysis",
        "semantic analysis",
        "abstract syntax tree",
        "ast",
        "intermediate representation",
        "ir",
        "code generation",
        "optimization",
        "register allocation",
        "linker",
        "assembler",
        "assembly language",
        "context free grammar",
        "regular expressions",
        "finite automata",
        "pushdown automata",
        "compiler optimization",
    },


    # ========================================================
    # 26. MOBILE DEVELOPMENT
    # ========================================================

    "mobile": {

        "mobile development",
        "android",
        "ios",
        "android architecture",
        "android activities",
        "android services",
        "android intents",
        "android lifecycle",
        "jetpack compose",
        "kotlin",
        "swift",
        "swiftui",
        "mobile networking",
        "mobile storage",
        "push notifications",
        "mobile security",
        "mobile performance",
    },


    # ========================================================
    # 27. DATA ENGINEERING
    # ========================================================

    "data_engineering": {

        "data engineering",
        "data pipelines",
        "etl",
        "elt",
        "data warehouses",
        "data lakes",
        "data lakehouse",
        "batch processing",
        "stream processing",
        "apache spark",
        "spark",
        "hadoop",
        "hdfs",
        "apache airflow",
        "airflow",
        "kafka",
        "data modeling",
        "dimensional modeling",
        "star schema",
        "snowflake schema",
        "data quality",
        "data governance",
        "data partitioning",
        "data lineage",
    },


    # ========================================================
    # 28. OBSERVABILITY / SRE
    # ========================================================

    "sre_observability": {

        "site reliability engineering",
        "sre",
        "observability",
        "monitoring",
        "logging",
        "metrics",
        "tracing",
        "distributed tracing",
        "prometheus",
        "grafana",
        "opentelemetry",
        "jaeger",
        "elk stack",
        "elasticsearch",
        "logstash",
        "kibana",
        "service level indicators",
        "sli",
        "service level objectives",
        "slo",
        "service level agreements",
        "sla",
        "error budgets",
        "incident management",
        "on call",
        "postmortems",
        "reliability engineering",
    },


    # ========================================================
    # 29. MESSAGE QUEUES / STREAMING
    # ========================================================

    "messaging_streaming": {

        "message queues",
        "message brokers",
        "publish subscribe",
        "pub sub",
        "apache kafka",
        "kafka",
        "kafka producers",
        "kafka consumers",
        "kafka partitions",
        "kafka offsets",
        "kafka consumer groups",
        "kafka replication",
        "kafka exactly once semantics",
        "rabbitmq",
        "rabbitmq exchanges",
        "rabbitmq queues",
        "routing keys",
        "amazon sqs",
        "amazon sns",
        "nats",
        "message ordering",
        "message deduplication",
        "dead letter queues",
        "retry queues",
        "event streaming",
    },


    # ========================================================
    # 30. WEB DEVELOPMENT
    # ========================================================

    "web_development": {

        "web development",
        "web architecture",
        "client server architecture",
        "browser architecture",
        "html",
        "css",
        "javascript",
        "typescript",
        "http",
        "https",
        "dns",
        "cdn",
        "cookies",
        "sessions",
        "web sockets",
        "webhooks",
        "rest",
        "graphql",
        "cors",
        "same origin policy",
        "content security policy",
        "web accessibility",
        "seo",
        "web performance",
        "browser caching",
    },


    # ========================================================
    # 31. REGEX / TEXT PROCESSING
    # ========================================================

    "text_processing": {

        "regular expressions",
        "regex",
        "pattern matching",
        "string parsing",
        "tokenization",
        "text normalization",
        "text search",
        "string algorithms",
        "kmp algorithm",
        "rabin karp",
        "z algorithm",
        "boyer moore",
    },


    # ========================================================
    # 32. PRODUCT / ENGINEERING PRACTICES
    # ========================================================

    "engineering_practices": {

        "agile",
        "scrum",
        "kanban",
        "technical planning",
        "code review",
        "design review",
        "architecture review",
        "incident response",
        "root cause analysis",
        "debugging",
        "production debugging",
        "performance debugging",
        "log analysis",
        "error handling",
        "exception handling",
        "clean code",
        "refactoring",
        "technical debt",
        "documentation",
        "api design",
        "backward compatibility",
        "semantic versioning",
    },
}


# ============================================================
# CATEGORY DISPLAY NAMES
# ============================================================

CATEGORY_LABELS = {
    "dsa": "Data Structures & Algorithms",
    "operating_systems": "Operating Systems",
    "dbms": "DBMS",
    "nosql": "NoSQL & Distributed Databases",
    "computer_networks": "Computer Networks",
    "backend": "Backend Development",
    "system_design": "System Design",
    "software_engineering": "Software Engineering",
    "oop_lld": "OOP & Low Level Design",
    "cpp": "C / C++",
    "java": "Java",
    "python": "Python",
    "javascript_typescript": "JavaScript / TypeScript",
    "frontend": "Frontend Development",
    "react": "React",
    "cloud": "Cloud Computing",
    "devops": "DevOps",
    "security": "Cybersecurity",
    "ai_ml": "AI / Machine Learning",
    "testing": "Software Testing",
    "architecture": "Software Architecture",
    "linux": "Linux / Unix",
    "git": "Git & Version Control",
    "system_programming": "System Programming",
    "compilers": "Compilers & Language Theory",
    "mobile": "Mobile Development",
    "data_engineering": "Data Engineering",
    "sre_observability": "SRE & Observability",
    "messaging_streaming": "Messaging & Streaming",
    "web_development": "Web Development",
    "text_processing": "Regex & Text Processing",
    "engineering_practices": "Engineering Practices",
}


# ============================================================
# ALIASES
# ============================================================

"""
Common user-entered variations.

The value points to the canonical topic stored in
TECHNICAL_TOPICS.
"""

TOPIC_ALIASES = {

    # DSA
    "ds": "dsa",
    "dsa": "dsa",
    "data structures": "dsa",
    "data structures and algorithms": "dsa",

    "hashmap": "hash maps",
    "hash map": "hash maps",
    "hashmaps": "hash maps",
    "hashtable": "hash tables",
    "hash table": "hash tables",

    "linkedlist": "linked lists",
    "linked list": "linked lists",

    "binary tree": "binary trees",
    "bst": "binary search trees",
    "avl": "avl trees",
    "rb tree": "red black trees",
    "red-black tree": "red black trees",

    "heap": "heaps",
    "priority queues": "priority queue",

    "dynamic programming": "dynamic programming",
    "dp": "dynamic programming",

    # Operating Systems
    "os": "operating systems",
    "operating system": "operating systems",

    "process": "processes",
    "thread": "threads",

    "virtual memory": "virtual memory",

    # Databases
    "database": "database fundamentals",
    "databases": "relational databases",
    "sql database": "relational databases",

    "dbms": "database fundamentals",

    "postgres": "relational databases",
    "postgresql": "relational databases",

    "mysql": "relational databases",

    "mongo": "mongodb",

    # Networks
    "networking": "computer networks",
    "computer networking": "computer networks",

    "tcp/ip": "tcp ip model",
    "tcp-ip": "tcp ip model",

    "websocket": "websockets",

    # Backend
    "api": "api design",
    "apis": "api design",
    "rest": "rest apis",
    "rest api": "rest apis",

    "web api": "rest apis",

    # System Design
    "hld": "high level design",
    "lld": "low level design",

    # Programming
    "cplusplus": "c++ programming",
    "cpp": "c++ programming",
    "c plus plus": "c++ programming",

    "py": "python",

    "js": "javascript",
    "javascript": "javascript",

    "ts": "typescript",
    "typescript": "typescript",

    # React
    "reactjs": "react",
    "react.js": "react",

    # Cloud
    "aws cloud": "aws",
    "amazon web services": "aws",

    # Kubernetes
    "k8s": "kubernetes",

    # Security
    "cyber security": "cybersecurity",
    "appsec": "application security",
    "application sec": "application security",

    "xss": "cross site scripting",
    "csrf": "cross site request forgery",
    "ssrf": "server side request forgery",

    # AI
    "artificial intelligence": "artificial intelligence",
    "machine learning": "machine learning",
    "ml": "machine learning",
    "ai": "artificial intelligence",
    "gen ai": "generative ai",
    "genai": "generative ai",
    "llm": "large language models",
    "llms": "large language models",

    # Git
    "version control": "version control",
    "git version control": "git",

    # Linux
    "unix": "unix",
    "linux os": "linux",
}


# ============================================================
# HELPERS
# ============================================================

def normalize_text(value: str) -> str:
    """
    Normalize user input before validation.

    Example:
        "  Binary Search  "
        -> "binary search"
    """

    return " ".join(
        value.strip().lower().split()
    )


def normalize_category(category: str) -> str | None:
    """
    Normalize a category.

    Supports both:
        "operating_systems"
        "Operating Systems"
    """

    normalized = normalize_text(category)

    if normalized in TECHNICAL_TOPICS:
        return normalized

    for key, label in CATEGORY_LABELS.items():

        if normalized == normalize_text(label):
            return key

    return None


def normalize_topic(topic: str) -> str:
    """
    Normalize topic and resolve common aliases.
    """

    normalized = normalize_text(topic)

    return TOPIC_ALIASES.get(
        normalized,
        normalized,
    )


def is_valid_category(category: str) -> bool:
    """
    Check whether a category is supported.
    """

    return (
        normalize_category(category)
        is not None
    )


def is_valid_topic(
    category: str,
    topic: str,
) -> bool:
    """
    Check whether the given topic belongs to
    the requested technical category.
    """

    normalized_category = normalize_category(
        category
    )

    if not normalized_category:
        return False

    normalized_topic = normalize_topic(topic)

    return normalized_topic in TECHNICAL_TOPICS[
        normalized_category
    ]


def get_topics_for_category(
    category: str,
) -> list[str]:
    """
    Return all topics for a category.

    Returns an empty list when category doesn't exist.
    """

    normalized_category = normalize_category(
        category
    )

    if not normalized_category:
        return []

    return sorted(
        TECHNICAL_TOPICS[
            normalized_category
        ]
    )


def get_all_categories() -> list[dict]:
    """
    Return categories in a frontend-friendly format.
    """

    return [
        {
            "value": key,
            "label": CATEGORY_LABELS[key],
        }
        for key in TECHNICAL_TOPICS
    ]


def get_all_topics() -> list[str]:
    """
    Return every unique topic across all categories.
    """

    topics = set()

    for category_topics in TECHNICAL_TOPICS.values():
        topics.update(category_topics)

    return sorted(topics)


def search_topics(
    query: str,
    category: str | None = None,
) -> list[str]:
    """
    Search approved technical topics.

    This can later be used for:
        "Can't find your topic?"
        -> search box

    Example:
        search_topics("segment")
        -> ["segment trees"]
    """

    normalized_query = normalize_text(query)

    if not normalized_query:
        return []

    if category:
        topics = get_topics_for_category(category)
    else:
        topics = get_all_topics()

    return [
        topic
        for topic in topics
        if normalized_query in topic
    ]