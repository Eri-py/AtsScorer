# AtsScorer – In-Depth Design Document

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [High-Level Architecture](#2-high-level-architecture)
3. [Repository Structure](#3-repository-structure)
4. [Shared Layer – Protocol Buffers](#4-shared-layer--protocol-buffers)
5. [MlServer – Python gRPC AI Service](#5-mlserver--python-grpc-ai-service)
   - 5.1 [Entry Point & Server Bootstrap](#51-entry-point--server-bootstrap)
   - 5.2 [gRPC Contracts](#52-grpc-contracts)
   - 5.3 [AnalyseResumeServicer](#53-analyseresumeservicer)
   - 5.4 [FileParser](#54-fileparser)
   - 5.5 [GitHubModelsClient](#55-githubmodelsclient)
   - 5.6 [Dependencies](#56-dependencies)
   - 5.7 [Data Samples](#57-data-samples)
6. [WebServer – ASP.NET Core 9 REST API](#6-webserver--aspnet-core-9-rest-api)
   - 6.1 [Solution Layout](#61-solution-layout)
   - 6.2 [AtsScorer.Common – Shared Utilities](#62-atsscorercommon--shared-utilities)
   - 6.3 [AtsScorer.Api – Application Entry Point](#63-atsscorerapi--application-entry-point)
   - 6.4 [Data Layer](#64-data-layer)
   - 6.5 [Controllers](#65-controllers)
   - 6.6 [Authentication Services](#66-authentication-services)
   - 6.7 [Email Service](#67-email-service)
   - 6.8 [Resume Analysis Service](#68-resume-analysis-service)
   - 6.9 [Result Pattern](#69-result-pattern)
   - 6.10 [Configuration & Launch Settings](#610-configuration--launch-settings)
7. [AtsScorer.Tests – Unit Test Project](#7-atsscorertesters--unit-test-project)
8. [Website – React / TypeScript Frontend](#8-website--react--typescript-frontend)
   - 8.1 [Technology Stack](#81-technology-stack)
   - 8.2 [Application Bootstrap](#82-application-bootstrap)
   - 8.3 [Routing Architecture](#83-routing-architecture)
   - 8.4 [Providers & Context](#84-providers--context)
   - 8.5 [API Communication Layer](#85-api-communication-layer)
   - 8.6 [Custom Hooks](#86-custom-hooks)
   - 8.7 [Component Tree](#87-component-tree)
   - 8.8 [Theme System](#88-theme-system)
   - 8.9 [Form Validation](#89-form-validation)
   - 8.10 [Build & Dev Tooling](#810-build--dev-tooling)
9. [End-to-End Data Flows](#9-end-to-end-data-flows)
   - 9.1 [User Registration Flow](#91-user-registration-flow)
   - 9.2 [User Login Flow](#92-user-login-flow)
   - 9.3 [Token Refresh Flow](#93-token-refresh-flow)
   - 9.4 [Resume Analysis Flow](#94-resume-analysis-flow)
10. [Security Design](#10-security-design)
11. [Cross-Cutting Concerns](#11-cross-cutting-concerns)

---

## 1. Project Overview

**AtsScorer** is a full-stack web application that helps job seekers assess how well their resume matches a given job description using an AI-powered Applicant Tracking System (ATS) scoring engine. A user uploads their resume (PDF, DOC, or DOCX), provides a job description, and receives:

- A **match score** (0–100 %)
- Qualitative **feedback** on the resume
- A list of **missing keywords**
- A per-skill **skills analysis** map

The system is composed of three independently runnable services that communicate over well-defined boundaries.

---

## 2. High-Level Architecture

```
┌──────────────────────────────────────────────────────────────────┐
│                        Browser (HTTPS)                           │
│                    Website  – Vite / React 19                    │
│                    https://localhost:3000                         │
└────────────────────────────┬─────────────────────────────────────┘
                             │  REST / JSON  (Axios, cookie-auth)
                             ▼
┌──────────────────────────────────────────────────────────────────┐
│               WebServer – ASP.NET Core 9 Web API                 │
│               https://localhost:7000  /  http://5000             │
│                                                                   │
│  Controllers → Services → Data (EF Core + PostgreSQL)            │
└────────────────────────────┬─────────────────────────────────────┘
                             │  gRPC (insecure, port 7002)
                             ▼
┌──────────────────────────────────────────────────────────────────┐
│             MlServer – Python gRPC server (port 7002)            │
│                                                                   │
│  AnalyseResumeServicer → FileParser → GitHubModelsClient         │
│                              (OpenAI-compatible – GitHub Models) │
└──────────────────────────────────────────────────────────────────┘
```

**Communication protocols:**

| Boundary               | Protocol        | Format            |
| ---------------------- | --------------- | ----------------- |
| Browser ↔ WebServer    | HTTPS REST      | JSON              |
| WebServer ↔ MlServer   | gRPC (insecure) | Protocol Buffers  |
| MlServer ↔ AI provider | HTTPS REST      | JSON (OpenAI SDK) |

---

## 3. Repository Structure

```
AtsScorer/
├── .gitignore                     # Global ignore rules for all sub-projects
├── DESIGN.md                      # This document
├── Shared/
│   └── Protos/
│       └── analyse_resume.proto   # Single source of truth for the gRPC contract
├── MlServer/                      # Python gRPC AI microservice
│   ├── server.py
│   ├── requirements.txt
│   ├── grpc_contracts/            # Auto-generated pb2 stubs
│   ├── services/
│   │   └── AnalyseResumeService/
│   │       ├── AnaylseResumeService.py
│   │       └── file_parser.py
│   ├── utils/
│   │   └── github_models_client.py
│   ├── data/
│   │   ├── job_description.txt    # Sample job description for manual testing
│   │   └── resumes/               # Sample PDF resumes for manual testing
│   └── notebook.ipynb             # Experimental Jupyter notebook
├── WebServer/                     # .NET 9 solution
│   ├── AtsScorer.sln
│   ├── AtsScorer.Common/          # Shared library (Result pattern, CryptoRandom)
│   ├── AtsScorer.Api/             # ASP.NET Core Web API
│   └── AtsScorer.Tests/           # NUnit test project
└── Website/                       # Vite + React 19 + TypeScript SPA
    ├── src/
    │   ├── api/
    │   ├── components/
    │   ├── hooks/
    │   ├── providers/
    │   ├── routes/
    │   └── themes/
    ├── package.json
    └── vite.config.ts
```

---

## 4. Shared Layer – Protocol Buffers

**File:** `Shared/Protos/analyse_resume.proto`

This is the single source of truth for the contract between the WebServer (gRPC client) and MlServer (gRPC server). Both sides generate their language-specific stubs from this file.

```proto
syntax = "proto3";
package analyse_resume;
option csharp_namespace = "AtsScorer.Api.GrpcContracts";

service AnalyseResume {
  rpc AnalyzeResume (AnalyseResumeRequest) returns (AnalyseResumeResponse);
}
```

**Request message – `AnalyseResumeRequest`:**

| Field             | Type     | Tag | Description                              |
| ----------------- | -------- | --- | ---------------------------------------- |
| `file`            | `bytes`  | 1   | Raw binary content of the resume         |
| `file_name`       | `string` | 2   | Original filename, used to detect format |
| `job_description` | `string` | 3   | Full text of the job posting             |

**Response message – `AnalyseResumeResponse`:**

| Field              | Type                  | Tag | Description                     |
| ------------------ | --------------------- | --- | ------------------------------- |
| `status`           | `string`              | 1   | `"success"` or error indicator  |
| `match_score`      | `double`              | 2   | Score in [0, 1]                 |
| `feedback`         | `string`              | 3   | Plain-text qualitative summary  |
| `missing_keywords` | `repeated string`     | 4   | Keywords absent from the resume |
| `skills_analysis`  | `map<string, string>` | 5   | Skill name → assessment text    |

**C# code generation:** The `.csproj` for `AtsScorer.Api` references the proto with `GrpcServices="Client"`, so MSBuild auto-generates the typed client at build time:

```xml
<Protobuf Include="..\..\Shared\Protos\*.proto" GrpcServices="Client" />
```

**Python code generation:** The pre-generated stubs live in `MlServer/grpc_contracts/` (`analyse_resume_pb2.py`, `analyse_resume_pb2_grpc.py`, `analyse_resume_pb2.pyi`). These were produced with `grpcio-tools` and must be regenerated if the proto changes.

---

## 5. MlServer – Python gRPC AI Service

### 5.1 Entry Point & Server Bootstrap

**File:** `MlServer/server.py`

```python
def serve():
    server = grpc.server(futures.ThreadPoolExecutor(max_workers=10))
    analyse_resume_pb2_grpc.add_AnalyseResumeServicer_to_server(AnaylseResumeServicer(), server)
    server.add_insecure_port("[::]:7002")
    server.start()
    server.wait_for_termination()
```

- Uses `grpc.server` with a thread pool of **10 workers**, allowing up to 10 concurrent RPC calls.
- Listens on **all network interfaces** (`[::]`) on port **7002** without TLS (insecure; acceptable for local/internal communication).
- Only one service is registered: `AnalyseResume`.

### 5.2 gRPC Contracts

**Directory:** `MlServer/grpc_contracts/`

| File                         | Purpose                                                              |
| ---------------------------- | -------------------------------------------------------------------- |
| `analyse_resume_pb2.py`      | Runtime serialisation/deserialisation generated by `protoc`          |
| `analyse_resume_pb2_grpc.py` | Base servicer class and stub client generated by `grpc_tools.protoc` |
| `analyse_resume_pb2.pyi`     | Python type stubs for IDE support and type checking                  |

The `.pyi` stub reveals the precise Python types for both messages:

- `AnalyseResumeRequest`: `file: bytes`, `file_name: str`, `job_description: str`
- `AnalyseResumeResponse`: `status: str`, `match_score: float`, `feedback: str`, `missing_keywords: RepeatedScalarFieldContainer[str]`, `skills_analysis: ScalarMap[str, str]`

### 5.3 AnalyseResumeServicer

**File:** `MlServer/services/AnalyseResumeService/AnaylseResumeService.py`

Implements the `AnalyseResumeServicer` base class generated from the proto. It is instantiated once when the server starts, so `GitHubModelsClient` is also created once and reused across calls.

**`AnalyzeResume` method logic:**

1. Extract the file extension from `request.file_name` using `rsplit('.', 1)[-1]`.
2. Call `FileParser.extract_text(request.file, file_extension)` to get plain text.
3. Pass the text and job description to `GitHubModelsClient.analyze_resume(...)`.
4. Map the returned `ResumeAnalysis` dataclass to an `AnalyseResumeResponse` proto message.
5. On any exception, set the gRPC status code to `INTERNAL` and return an empty response.

### 5.4 FileParser

**File:** `MlServer/services/AnalyseResumeService/file_parser.py`

A stateless utility class with only `@staticmethod` methods. Converts raw bytes into plain text based on file format.

**Supported formats:**

| Extension        | Library                | Notes                                                 |
| ---------------- | ---------------------- | ----------------------------------------------------- |
| `.pdf`           | `pypdf.PdfReader`      | Reads from an `io.BytesIO` object; iterates all pages |
| `.doc` / `.docx` | `python-docx.Document` | Extracts paragraphs (non-empty) and table cell text   |
| Everything else  | —                      | Returns empty string `""`                             |

**PDF extraction detail:**

```python
pdf_file_object = io.BytesIO(pdf_bytes)
reader = PdfReader(pdf_file_object)
extracted_text = ""
for page in reader.pages:
    extracted_text += page.extract_text()
```

**DOCX extraction detail:**

- Iterates `doc.paragraphs`, filtering blank entries.
- Also iterates all `doc.tables → rows → cells` to capture text inside tables (a common resume element).
- Returns newline-joined text.

**Error handling:** Each private method catches all exceptions, prints the error, and returns an empty string rather than propagating.

### 5.5 GitHubModelsClient

**File:** `MlServer/utils/github_models_client.py`

The AI inference client, implemented as a class. Uses the OpenAI Python SDK pointed at the **GitHub Models** inference endpoint (`https://models.inference.ai.azure.com`), which is OpenAI API-compatible.

**Constructor configuration (environment variables):**

| Variable                    | Default       | Purpose                              |
| --------------------------- | ------------- | ------------------------------------ |
| `GITHUB_TOKEN` / `GH_TOKEN` | _(required)_  | API token for GitHub Models          |
| `GITHUB_MODEL`              | `gpt-4o-mini` | Model identifier                     |
| `RESUME_MAX_CHARS`          | `14000`       | Truncation limit for resume text     |
| `JOB_MAX_CHARS`             | `7000`        | Truncation limit for job description |

**`analyze_resume` method:**

1. **Truncates** both inputs to their respective character limits to stay within context windows.
2. Sends a `chat.completions.create` request with:
   - `temperature=0.2` (low randomness for consistent scoring)
   - `response_format={"type": "json_object"}` (forces structured JSON output)
   - A detailed **system prompt** that defines the scoring rubric and instructs the model to return `{score, feedback, missing_keywords, skills_analysis}`.
   - A **user prompt** containing the job description and resume text.
3. Parses the JSON response.
4. Uses three defensive helper methods to sanitize values before returning:
   - `_safe_score`: Clamps the score to `[0.0, 1.0]`.
   - `_safe_keywords`: Validates it is a list of non-empty strings.
   - `_safe_skills`: Validates it is a dict of non-empty string keys and values.
5. Returns a `ResumeAnalysis` dataclass.

**Scoring rubric (embedded in system prompt):**

| Range     | Label         |
| --------- | ------------- |
| 0.85–1.0  | Strong match  |
| 0.70–0.84 | Good match    |
| 0.50–0.69 | Partial match |
| 0.30–0.49 | Weak match    |
| 0.00–0.29 | Poor match    |

The prompt explicitly instructs the model to credit transferable skills and synonyms, not just exact keyword matches.

**`ResumeAnalysis` dataclass:**

```python
@dataclass
class ResumeAnalysis:
    score: float
    feedback: str
    missing_keywords: list[str]
    skills_analysis: dict[str, str]
```

### 5.6 Dependencies

**File:** `MlServer/requirements.txt`

| Package                       | Purpose                                                      |
| ----------------------------- | ------------------------------------------------------------ |
| `grpcio-tools`                | Generating pb2 stubs from `.proto`                           |
| `openai`                      | OpenAI-compatible SDK for GitHub Models                      |
| `pypdf`                       | PDF text extraction                                          |
| `python-docx`                 | DOCX text extraction                                         |
| `pymupdf`                     | Alternative PDF library (present but not used in main path)  |
| `pytesseract`                 | OCR for image-based PDFs (present but not used in main path) |
| `transformers`                | HuggingFace Transformers (used in notebook, not production)  |
| `accelerate` / `bitsandbytes` | HuggingFace acceleration (notebook only)                     |
| `ipykernel` / `ipywidgets`    | Jupyter notebook support                                     |

### 5.7 Data Samples

**Directory:** `MlServer/data/`

- `job_description.txt`: A realistic Software Engineer job posting used as a reference during manual testing and development.
- `resumes/`: Five sample PDF resumes covering diverse backgrounds (biology, business administration, English, entry-level nursing, music) — intentionally off-target to test the scorer's ability to identify poor matches.

---

## 6. WebServer – ASP.NET Core 9 REST API

### 6.1 Solution Layout

**File:** `WebServer/AtsScorer.sln`

Three projects in the solution:

| Project            | SDK                     | Purpose                                           |
| ------------------ | ----------------------- | ------------------------------------------------- |
| `AtsScorer.Common` | `Microsoft.NET.Sdk`     | Library: `Result<T>` pattern, `CryptoRandom`      |
| `AtsScorer.Api`    | `Microsoft.NET.Sdk.Web` | Web API: controllers, services, data, gRPC client |
| `AtsScorer.Tests`  | `Microsoft.NET.Sdk`     | NUnit test project                                |

### 6.2 AtsScorer.Common – Shared Utilities

**File:** `WebServer/AtsScorer.Common/`

#### Result Pattern

`Result.cs` defines a discriminated-union-style result type used throughout all service layers. It avoids throwing exceptions for expected business logic failures.

**`ResultTypes` enum:**

```csharp
Success | NoContent | BadRequest | Unauthorized | NotFound | Conflict | InternalServerError
```

**`Result` (non-generic) – for operations with no return data:**

- `IsSuccess` → `true` when `ResultType == NoContent`
- Factory methods: `NoContent()`, `BadRequest(msg)`, `Unauthorized(msg)`, `NotFound(msg)`, `Conflict(msg)`, `InternalServerError(msg)`

**`Result<T>` (generic) – for operations that return data:**

- `IsSuccess` → `true` when `ResultType == Success`
- Factory: `Success(T content)`
- **Implicit conversion** from `Result` → `Result<T>` for propagating errors up the call chain without re-wrapping. Throws `InvalidOperationException` if `NoContent` is accidentally converted.

#### CryptoRandom

`CryptoRandom.cs` provides thread-safe cryptographically secure random integers using `RandomNumberGenerator`:

```csharp
public static int NextInt()
```

Uses `ThreadLocal<RandomNumberGenerator>` and `ThreadLocal<byte[]>` to avoid cross-thread contention. The returned value is masked with `int.MaxValue` to ensure it is always positive.

Used by `OtpService` to generate OTP digits, and by `JwtService` to generate refresh token characters.

### 6.3 AtsScorer.Api – Application Entry Point

**File:** `WebServer/AtsScorer.Api/Program.cs`

The ASP.NET Core startup pipeline:

1. **`AddControllers()`** – registers MVC controllers.
2. **`AddOpenApi()` + `MapScalarApiReference()`** – Scalar-powered OpenAPI UI (development only).
3. **CORS** (development only): Allows the frontend origins configured in `appsettings.Development.json` under `ClientOrigin:Local` and `ClientOrigin:Network`. Requires credentials (cookie auth). Uses `SameSite=Lax` to work in the browser.
4. **`AddMemoryCache()`** – in-process cache used by OTP service.
5. **`AddDatabases(config)`** – EF Core + Npgsql (PostgreSQL), development connection string only.
6. **`AddAuthServices(config)`** – JWT bearer authentication, all auth service registrations.
7. **`AddEmailServices(env)`** – Mailtrap SMTP email service (development only).
8. **`AddResumeAnalysisServices(config)`** – typed gRPC client + `IAnalyseResumeService`.
9. Middleware pipeline: OpenAPI → CORS → HTTPS redirect → Authentication → Authorization → Controllers.

### 6.4 Data Layer

**Directory:** `WebServer/AtsScorer.Api/Data/`

#### DbContext

`AtsScorerDbContext` extends `DbContext` with two `DbSet`s:

- `Users` → `UserEntity`
- `RefreshTokens` → `RefreshTokenEntity`

`OnModelCreating` adds a **unique index** on `UserEntity.Email` to enforce uniqueness at the database level.

#### Entities

**`UserEntity` (record class):**

| Property        | Type                              | Notes                                   |
| --------------- | --------------------------------- | --------------------------------------- |
| `Id`            | `Guid`                            | Primary key                             |
| `Email`         | `string`                          | Unique, lowercased before storage       |
| `PasswordHash`  | `string`                          | ASP.NET Core `PasswordHasher<T>` output |
| `CreatedAt`     | `DateTime`                        | UTC timestamp                           |
| `RefreshTokens` | `ICollection<RefreshTokenEntity>` | Navigation property                     |

**`RefreshTokenEntity`:**

| Property         | Type          | Notes                         |
| ---------------- | ------------- | ----------------------------- |
| `Id`             | `Guid`        | Primary key                   |
| `TokenHash`      | `string`      | SHA-256 hash of the raw token |
| `TokenExpiresAt` | `DateTime`    | UTC expiry                    |
| `UserId`         | `Guid`        | Foreign key to `UserEntity`   |
| `User`           | `UserEntity?` | Navigation property           |

#### DatabaseRegistration

Extension method `AddDatabases(IServiceCollection, IConfiguration)` registers `AtsScorerDbContext` with Npgsql, reading the connection string from `ConnectionStrings:Development` — but only when `ASPNETCORE_ENVIRONMENT == "Development"`.

> **Note:** Database migrations are gitignored (`Migrations/` is in `.gitignore`), meaning they are generated locally and not committed.

### 6.5 Controllers

All controllers use **constructor injection** with primary constructor syntax (`C# 12`).

#### `AnalyseResumeController`

- **Route:** `POST /api/analyse-resume`
- **Auth:** `[Authorize]` — requires a valid `accessToken` cookie.
- **Input:** `multipart/form-data` with `file` (IFormFile), `fileName` (string), `jobDescription` (string).
- **Processing:** Delegates to `IAnalyseResumeService.AnalyseResumeAsync(...)`.
- **Output:** `AnalyseResumeResponse` JSON on success, or appropriate HTTP error via `Result.ToActionResult<T>()`.

#### `AuthController`

- **Route prefix:** `/api/auth`

| Endpoint           | Method | Auth Required     | Description                                                                                                          |
| ------------------ | ------ | ----------------- | -------------------------------------------------------------------------------------------------------------------- |
| `refresh-token`    | POST   | No                | Reads `__Secure-refreshToken` cookie, calls `ITokenService.VerifyRefreshTokenAsync`, sets new cookies or returns 401 |
| `logout`           | POST   | No                | Deletes both auth cookies                                                                                            |
| `get-user-details` | GET    | No (reads claims) | Returns `{ isAuthenticated, user }` — used by the frontend `AuthProvider` on load                                    |

**Get-user-details response shape:**

```json
{
  "isAuthenticated": true,
  "user": {
    "id": "...",
    "username": "alice",
    "email": "alice@example.com",
    "firstname": null,
    "lastname": null
  }
}
```

`username` is derived by splitting the email at `@` and taking the first part.

#### `LoginController`

- **Route:** `POST /api/login`
- **Input:** `{ "identifier": "email@example.com", "password": "..." }` (JSON body)
- **Processing:** Calls `ILoginService.LoginAsync(request)`. On success, sets auth cookies and returns `204 No Content`. On failure, returns the error result.

#### `SignUpController`

- **Route prefix:** `/api/sign-up`

| Endpoint     | Method | Description                              |
| ------------ | ------ | ---------------------------------------- |
| `start`      | POST   | Checks email uniqueness, sends OTP email |
| `verify-otp` | POST   | Verifies OTP from cache                  |
| `resend-otp` | POST   | Sends a new OTP                          |
| `complete`   | POST   | Creates user account and issues tokens   |

#### `CookieHelper`

Static utility class that sets both auth cookies on the HTTP response:

| Cookie name             | Path                      | SameSite | Secure    | MaxAge |
| ----------------------- | ------------------------- | -------- | --------- | ------ |
| `accessToken`           | `/api`                    | Lax      | `IsHttps` | 15 min |
| `__Secure-refreshToken` | `/api/auth/refresh-token` | Strict   | `IsHttps` | 7 days |

The `__Secure-` prefix and `Strict` same-site policy on the refresh token prevent it from being sent in cross-site requests or read by JavaScript. The access token uses `Lax` so it is sent in same-site navigations and top-level cross-site GETs, but scoped to `/api` to avoid leaking to other paths.

### 6.6 Authentication Services

**Directory:** `WebServer/AtsScorer.Api/Services/AuthServices/`

#### AuthConfig

Centralized constants for token lifetimes:

| Constant                     | Value      |
| ---------------------------- | ---------- |
| `OtpValidForMinutes`         | 5 minutes  |
| `AccessTokenValidForMinutes` | 15 minutes |
| `RefreshTokenValidForDays`   | 7 days     |

#### AuthResult

Record carrying the four token values needed to set cookies:

```csharp
public record class AuthResult {
    string AccessToken;
    string RefreshToken;
    DateTime AccessTokenExpiresAt;
    DateTime RefreshTokenExpiresAt;
}
```

#### AuthServicesRegistration

Registers:

- **JWT Bearer authentication** with cookie extraction (`OnMessageReceived` event reads `accessToken` cookie instead of `Authorization` header).
- Token validation parameters: issuer, audience, lifetime, and HMAC-SHA256 signing key from `Jwt:Secret`.
- `ITokenService → JwtService` (scoped)
- `IOtpService → OtpService` (scoped)
- `ISignUpService → SignUpService` (scoped)
- `ILoginService → LoginService` (scoped)

#### OtpService

Implements `IOtpService`. Uses `IMemoryCache` and `IEmailService`.

**`CreateOtp(int otpValidForMinutes)`:**

- Generates a 6-digit numeric code using `CryptoRandom.NextInt() % 1000000` formatted as `"000000"`.
- Returns an `OtpDetails` record with the code and UTC expiry.

**`SendOtpAsync(string email, string purpose)`:**

1. Calls `emailService.SendOtpEmailAsync(...)`.
2. If email fails, returns the error immediately (OTP is **not** cached).
3. If email succeeds, stores the OTP in memory cache with key `otp_{purpose}_{email}` for `OtpValidForMinutes` minutes.
4. Returns `OtpResponse { OtpExpiresAt }`.

**`VerifyOtp(string email, string otp, string purpose)`:**

1. Looks up `otp_{purpose}_{email}` in cache.
2. If missing or value doesn't match: returns `BadRequest("Invalid or expired verification code")`.
3. On success: removes the OTP from cache (single-use), stores `verified_{purpose}_{email} = true` in cache for **15 minutes**.

#### SignUpService

Implements `ISignUpService`. Orchestrates the multi-step registration flow.

**`StartSignUpAsync`:** Checks for existing users, then delegates to `OtpService.SendOtpAsync`.

**`VerifyOtp`:** Delegates to `OtpService.VerifyOtp` with the `"signup"` purpose string.

**`ResendOtpAsync`:** Re-sends OTP for the same email (no duplicate check here).

**`CompleteSignUpAsync`:**

1. Verifies the email was OTP-validated by checking `verified_signup_{email}` in cache.
2. Re-checks for existing user (race condition guard).
3. Hashes the password using `PasswordHasher<UserEntity>`.
4. Opens a **database transaction**.
5. Creates and saves `UserEntity` + `RefreshTokenEntity` in one `SaveChangesAsync` call.
6. Commits the transaction.
7. Removes the `verified_*` cache entry.
8. Creates an access token and returns `AuthResult`.
9. On exception: rolls back the transaction and returns `InternalServerError`.

#### LoginService

Implements `ILoginService`.

**`LoginAsync`:**

1. Normalizes email to lowercase.
2. Queries for the user by email (`FirstOrDefaultAsync`).
3. Verifies password with `PasswordHasher<UserEntity>.VerifyHashedPassword`.
4. Creates an access token (JWT) and a refresh token (random 64-char alphanumeric string).
5. Stores the **hash** of the refresh token in the database.
6. Returns `AuthResult` with both tokens.

Both login and sign-up return the same generic `"Invalid email or password"` message on auth failure to prevent user enumeration.

#### JwtService

Implements `ITokenService`.

**`CreateAccessToken(UserEntity user, int tokenValidForMinutes)`:**

- Claims: `NameIdentifier` (user GUID), `Email`.
- Algorithm: `HmacSha256`.
- Config keys: `Jwt:Secret`, `Jwt:Issuer`, `Jwt:Audience`.
- Returns `TokenDetails { Value (JWT string), ExpiresAt }`.

**`CreateRefreshToken(int tokenValidForDays)`:**

- Generates a 64-character alphanumeric string using `CryptoRandom.NextInt()`.
- Returns `TokenDetails`.

**`HashToken(string token)`:**

- SHA-256 hash, Base64-encoded. Used to store refresh tokens in the database without keeping the raw value.

**`VerifyRefreshTokenAsync(string refreshToken)`:**

1. Hashes the incoming token.
2. Queries `RefreshTokens` including the related `User` by token hash.
3. If not found → `NotFound("Invalid refresh token")`.
4. Opens a **transaction**.
5. Generates new access and refresh tokens.
6. **Rotates** the refresh token in-place (updates `TokenHash` and `TokenExpiresAt` on the existing DB row).
7. Saves and commits.
8. Returns new `AuthResult` (token rotation — old token is immediately invalidated).

### 6.7 Email Service

**Directory:** `WebServer/AtsScorer.Api/Services/EmailServices/`

`IEmailService` defines two methods:

- `SendEmailAsync(to, subject, body)` – generic HTML email sender.
- `SendOtpEmailAsync(to, otp, otpValidFor)` – reads the HTML template, substitutes placeholders, calls `SendEmailAsync`.

`MailtrapEmailService` is the only concrete implementation (registered in development only). It uses **MailKit** with STARTTLS to send via Mailtrap's SMTP server, configured via `Mailtrap:Host`, `Mailtrap:Port`, `Mailtrap:Username`, `Mailtrap:Password`, `Mailtrap:FromName`, `Mailtrap:FromAddress`.

**Email template:** `EmailTemplates/VerificationEmailTemplate.html` is an inline-styled HTML file with three string placeholders:

- `{{Otp}}` – the 6-digit code
- `{{OtpValidFor}}` – expiry description (e.g. "5 minutes")
- `{{Username}}` – derived from the email's local part

The template features a branded header (blue `#365cce`), a centered monospaced OTP display, and a safety footer.

### 6.8 Resume Analysis Service

**Directory:** `WebServer/AtsScorer.Api/Services/AnalyseResumeServices/`

`IAnalyseResumeService` exposes:

```csharp
Task<Result<AnalyseResumeResponse>> AnalyseResumeAsync(IFormFile resume, string fileName, string jobDescription);
```

`AnalyseResumeService` is the concrete implementation:

1. Guards against empty files.
2. Copies `IFormFile` stream into a `byte[]` via `MemoryStream`.
3. Builds an `AnalyseResumeRequest` protobuf message with `ByteString.CopyFrom(fileBytes)`.
4. Calls `AnalyseResume.AnalyseResumeClient.AnalyzeResumeAsync(request)` (auto-generated typed gRPC client).
5. Wraps the response in `Result<AnalyseResumeResponse>.Success(grpcResponse)`.

`AnalyseResumeServiceRegistration` registers:

- `AnalyseResume.AnalyseResumeClient` as a **typed gRPC client** with `AddGrpcClient`, pointing to `GrpcServices:Development` from configuration.
- `IAnalyseResumeService → AnalyseResumeService` (scoped).

### 6.9 Result Pattern

**File:** `WebServer/AtsScorer.Api/Extensions/ResultExtensions.cs`

`ResultExtensions` maps `Result` / `Result<T>` to ASP.NET Core `ActionResult` types:

| ResultType            | HTTP status                    |
| --------------------- | ------------------------------ |
| `Success`             | 200 OK (with body for generic) |
| `NoContent`           | 204 No Content                 |
| `BadRequest`          | 400 Bad Request `{ message }`  |
| `Unauthorized`        | 401 Unauthorized `{ message }` |
| `NotFound`            | 404 Not Found `{ message }`    |
| `Conflict`            | 409 Conflict `{ message }`     |
| `InternalServerError` | 500 `{ message }`              |

All error bodies follow the same `{ "message": "..." }` shape, which the frontend `useServerError` hook reads.

### 6.10 Configuration & Launch Settings

**`appsettings.json`** – base config (committed); contains only logging defaults and `AllowedHosts: *`.

**`appsettings.Development.json`** – gitignored; expected keys:

| Key                                                         | Description                                         |
| ----------------------------------------------------------- | --------------------------------------------------- |
| `ConnectionStrings:Development`                             | PostgreSQL connection string                        |
| `Jwt:Secret`                                                | HMAC-SHA256 signing key                             |
| `Jwt:Issuer`                                                | JWT issuer claim                                    |
| `Jwt:Audience`                                              | JWT audience claim                                  |
| `Mailtrap:Host/Port/Username/Password/FromName/FromAddress` | Mailtrap SMTP credentials                           |
| `GrpcServices:Development`                                  | URL to MlServer gRPC (e.g. `http://localhost:7002`) |
| `ClientOrigin:Name`                                         | CORS policy name                                    |
| `ClientOrigin:Local`                                        | Frontend local URL (e.g. `https://localhost:3000`)  |
| `ClientOrigin:Network`                                      | Frontend network URL                                |

**`launchSettings.json`:**

- Profile `https`: `https://localhost:7000;http://localhost:5000`, environment = `Development`.

---

## 7. AtsScorer.Tests – Unit Test Project

**File:** `WebServer/AtsScorer.Tests/OtpServiceTests.cs`

Framework: **NUnit 4** with **Moq** for mocking. Target: `net9.0`.

Tests `OtpService` in full isolation using mocked `IMemoryCache` and `IEmailService`.

### Test Coverage

**`CreateOtp` tests (3):**

- Verifies output is exactly 6 characters and matches `^\d{6}$`.
- Verifies `ExpiresAt` is within 5 ms of expected `DateTime.UtcNow + otpValidForMinutes`.
- Verifies 10 consecutive calls produce 10 distinct OTPs (probabilistic uniqueness check).

**`SendOtpAsync` tests (3):**

- **Happy path:** Asserts `IsSuccess = true`, `OtpExpiresAt != default`, email sent once with a 6-digit OTP, cache entry created with the correct TTL.
- **Email failure:** Asserts `IsSuccess = false`, `ResultType = InternalServerError`, cache `CreateEntry` never called.
- **OTP uniqueness on resend:** Captures OTPs from two consecutive calls and asserts both were sent (length == 2).

**`VerifyOtp` tests (5):**

- **Valid OTP:** `IsSuccess = true`, `ResultType = NoContent`, cache `Remove` called once with the correct key.
- **Not in cache:** `IsSuccess = false`, `ResultType = BadRequest`, specific error message.
- **Wrong OTP:** `IsSuccess = false`, `ResultType = BadRequest`.
- **Removes on success:** Explicitly verifies `Remove(cacheKey)` called exactly once.
- **Different purposes isolation:** OTP valid for `signup` purpose is rejected for `password-reset` purpose (different cache keys).
- **Null cached value:** Returns `BadRequest` even when cache returns `true` but value is `null`.

---

## 8. Website – React / TypeScript Frontend

### 8.1 Technology Stack

| Category           | Library / Version               |
| ------------------ | ------------------------------- |
| UI Framework       | React 19                        |
| Language           | TypeScript 5.8                  |
| Build Tool         | Vite 7                          |
| UI Components      | MUI (Material UI) v7            |
| Routing            | TanStack Router v1 (file-based) |
| Server State       | TanStack Query v5               |
| Forms              | React Hook Form v7              |
| Schema Validation  | Zod v4                          |
| HTTP Client        | Axios v1                        |
| File Drag-and-Drop | react-dropzone v14              |
| OTP Input          | mui-one-time-password-input v5  |
| Date/Countdown     | date-fns v4, react-countdown v2 |
| Dev HTTPS          | vite-plugin-mkcert              |

### 8.2 Application Bootstrap

**File:** `Website/src/main.tsx`

```tsx
const router = createRouter({ routeTree });
const queryClient = new QueryClient({ defaultOptions: { queries: { retry: 1 } } });

ReactDOM.createRoot(rootElement).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
    </QueryClientProvider>
  </StrictMode>,
);
```

- `QueryClient` is configured with `retry: 1` so failed queries retry once before surfacing an error.
- The router type is registered on the `@tanstack/react-router` module for full TypeScript inference on links and navigation.

### 8.3 Routing Architecture

TanStack Router uses **file-based routing** with auto code splitting (enabled via `tanstackRouter({ autoCodeSplitting: true })`). Route files live in `src/routes/`, and the route tree is auto-generated into `src/routeTree.gen.ts`.

**Route hierarchy:**

```
__root.tsx           ← Root: CustomThemeProvider + BreakpointProvider
├── _auth.tsx        ← Auth layout: centered FormContainer, back-to-home button
│   ├── login.tsx    ← /login
│   └── sign-up.tsx  ← /sign-up
└── _app.tsx         ← App layout: AuthProvider, responsive Navbar
    └── index.tsx    ← / (Home page)
```

**`__root.tsx`** – Root layout: wraps the entire app in `CustomThemeProvider` (MUI theme + dark mode) and `BreakpointProvider` (responsive `isDesktop` context).

**`_auth.tsx`** – Authentication layout: a `FormContainer` that vertically and horizontally centers the auth forms. On desktop, shows an "ATS Scorer" text link back to `/`.

**`_app.tsx`** – Main app layout: wraps content in `AuthProvider` (fetches user details from the API on mount), renders the appropriate navbar (desktop vs. mobile), and constrains the main content area height with CSS `calc` to account for the navbar.

**`_app/index.tsx`** – The single main page (`/`). A two-step wizard:

- **Step 0:** Resume upload (drag-and-drop or file picker).
- **Step 1:** Job description text field.
- After submission, results panel replaces the form.

**`_auth/login.tsx`** – Login form: email + password, Zod validation, server error display.

**`_auth/sign-up.tsx`** – Sign-up wizard: 3-step MUI stepper (Email → OTP verification → Password), Zod validation per step.

### 8.4 Providers & Context

#### CustomThemeProvider

- Reads `currentThemeMode` from `localStorage` on first render; falls back to the system preference via `prefers-color-scheme: dark` media query.
- Manages a `"light" | "dark"` state.
- Provides `ThemeToggleContext` with `{ mode, toggleTheme }` so any descendant can read or toggle the theme.
- Persists the chosen mode to `localStorage` on toggle.

#### BreakpointProvider

- Uses MUI's `useMediaQuery(theme.breakpoints.up("md"))` to determine `isDesktop`.
- Provides `BreakpointContext` with `{ isDesktop: boolean }`.
- Renders responsive UI (desktop navbar vs. mobile hamburger drawer) without prop-drilling.

#### AuthProvider

- On mount, fires a TanStack Query request (`queryKey: ["userDetails"]`) to `GET /api/auth/get-user-details`.
- `staleTime: 15 * 60 * 1000` (15 minutes) — matches the access token lifetime so the query refetches only when the token might have expired.
- `refetchOnWindowFocus: false` — prevents re-fetching every time the tab is focused.
- Provides `AuthContext` with `{ isAuthenticated: boolean | undefined, user: UserObject | null }`.

### 8.5 API Communication Layer

**File:** `Website/src/api/axiosInstance.ts`

- Base URL: `https://localhost:7000/api` (hardcoded for development).
- `withCredentials: true` — ensures cookies are sent with every request (required for cookie-based auth).

**Axios response interceptor** – implements a token-refresh queue pattern:

1. On any `401` response (except refresh-token requests):
   - If a refresh is already in progress, queues the original request.
   - Otherwise, sets `isRefreshing = true`, calls `POST /auth/refresh-token`.
   - On success: resolves the queue and retries the original request.
   - On failure: rejects the queue and redirects to `/login`.
2. Prevents deadlock by skipping the interceptor for refresh-token requests.

### 8.6 Custom Hooks

#### `useAuth` (`hooks/app/useAuth.ts`)

- Reads `AuthContext` and throws if used outside `AuthProvider`.
- Returns `{ isAuthenticated, user }`.

#### `useThemeToggle` (`hooks/shared/useThemeToggle.ts`)

- Reads `ThemeToggleContext` with error if outside provider.
- Returns `{ mode, toggleTheme }`.

#### `useBreakpoint` (`hooks/shared/useBreakpoint.ts`)

- Reads `BreakpointContext`, throws if outside provider.
- Returns `{ isDesktop }`.

#### `useDebounce<T>` (`hooks/shared/useDebounce.ts`)

- Generic debounce hook: delays updating `debouncedValue` until `delay` ms after the last `value` change.
- Default delay: 500 ms.
- Used by `PasswordStep` to debounce live password requirement checks.

#### `useServerError` (`hooks/auth/useServerError.ts`)

- Stores a `serverErrorMessage: string | null`.
- `handleServerError(axiosError)`: extracts `error.response.data.message` and sets it; auto-clears after 10 seconds.
- `clearServerError()`: immediately clears.
- Used by `useLogin`, `useSignUp`.

#### `useLogin` (`hooks/auth/useLogin.ts`)

- TanStack `useMutation` around `POST /api/login`.
- On success: navigates to `/`.
- On error: calls `handleServerError`.
- Exposes `{ login, isLoggingIn, serverErrorMessage, clearServerError }`.

#### `useSignUp` (`hooks/auth/useSignUp.ts`)

- Manages `step` (0–2) and `otpExpiresAt` state.
- Four mutations: `startSignUp`, `verifyOtp`, `resendOtp`, `completeSignUp`.
- Step transitions triggered by `onSuccess` callbacks.
- `resendOtpAsync` is exposed as `mutateAsync` so the `OtpStep` component can `await` it and update the countdown timer.

#### `useFileUpload` (`hooks/home/useFileUpload.ts`)

- Wraps `react-dropzone` with constraints:
  - Accepted MIME types: `application/pdf`, `application/msword`, `application/vnd.openxmlformats-officedocument.wordprocessingml.document`.
  - Max file size: **10 MB**.
  - Max files: **1**.
- `onDrop`: sets `file`, clears errors.
- `onDropRejected`: maps error codes (`file-invalid-type`, `file-too-large`, `too-many-files`) to user-friendly messages; auto-clears after 10 seconds.
- Exposes `{ file, errors, getRootProps, getInputProps, isDragActive, removeFile, removeError }`.

#### `useHomePage` (`hooks/home/useHomePage.ts`)

- Manages `jobDescription` text state and its validation error.
- TanStack `useMutation` around `POST /api/analyse-resume` (multipart form data).
- `submitAnalysis`: assembles a `FormData` with `file`, `fileName`, `jobDescription` fields.
- `validateJobDescription`: uses `z.string().min(1)` to validate; sets or clears error.
- `handleJobDescriptionChange`: updates state + validates on every change.
- `resetAnalysis`: resets all state to initial.
- Exposes all state values and handlers.

### 8.7 Component Tree

```
Root (CustomThemeProvider, BreakpointProvider)
│
├── _app (AuthProvider)
│   ├── DesktopNavbar (md+)
│   │   ├── NavbarContainer
│   │   ├── "ATS Scorer" logo-button
│   │   └── RightButtonGroup
│   │       ├── ThemeSwitch (styled MUI Switch)
│   │       ├── Login / Sign up buttons (if !isAuthenticated)
│   │       └── Logout button (if isAuthenticated)
│   ├── MobileNavbar (xs–sm)
│   │   ├── NavbarContainer
│   │   ├── "ATS Scorer" text
│   │   ├── Hamburger IconButton
│   │   └── Drawer
│   │       ├── Theme toggle ListItemButton
│   │       ├── Login / Sign Up ListItemButtons (if !isAuthenticated)
│   │       └── Logout ListItemButton (if isAuthenticated)
│   └── HomePage (/)
│       ├── HomeHeader ("Transform Your Resume")
│       ├── Error Alerts (from useFileUpload.errors)
│       ├── [if analysisResult] AnalysisResults
│       │   ├── ScoreDisplay (LinearProgress + score label)
│       │   ├── FeedbackSection
│       │   ├── MissingKeywords (MUI Chips)
│       │   ├── SkillsAnalysis (key: value list)
│       │   └── "Analyze Another Resume" Button
│       └── [else] Form
│           ├── MobileStepper (dots, 2 steps)
│           ├── [step 0] UploadArea (drag-and-drop Paper)
│           ├── [step 1] TextField (job description, multiline, resizable)
│           ├── FilePreview (file icon + name + size + remove button)
│           └── ContinueButton
│               ├── [step 0] "Continue" button
│               └── [step 1] "Analyze Resume" submit button (loading state)
│
└── _auth (FormContainer)
    ├── [Desktop] "ATS Scorer" back-link button
    ├── login (/login)
    │   ├── Alert (server error)
    │   └── UsernameAndPassword
    │       ├── CustomFormHeader
    │       ├── CustomTextField (email, with AccountCircleIcon)
    │       ├── CustomTextField (password, with LockIcon + visibility toggle)
    │       ├── Continue Button
    │       ├── OAuthButtonGroup (Google – disabled, "Coming soon")
    │       └── AuthFooter (link to sign-up)
    └── sign-up (/sign-up)
        ├── HorizontalLinearStepper (Email | Verification Code | Password)
        ├── Alert (server error)
        └── [step 0] EmailStep
        │   ├── CustomFormHeader
        │   ├── CustomTextField (email)
        │   ├── Continue Button
        │   ├── OAuthButtonGroup
        │   └── AuthFooter (link to login)
        ├── [step 1] OtpStep
        │   ├── CustomFormHeader
        │   ├── MuiOtpInput (6 cells, numeric)
        │   ├── Countdown timer (react-countdown)
        │   ├── "Resend Code" link (enabled after 1/5 of OTP lifetime)
        │   ├── Continue Button
        │   └── Back Button
        └── [step 2] PasswordStep
            ├── CustomFormHeader
            ├── CustomTextField (password with visibility toggle)
            ├── PasswordRequirements (live validation checklist)
            ├── CustomTextField (confirm password)
            └── Sign up submit Button
```

### 8.8 Theme System

**File:** `Website/src/themes/mainTheme.ts`

Uses MUI `createTheme`. The factory function `mainTheme(isDarkMode: boolean)` is called on every mode toggle.

**Breakpoints:** Standard MUI values (`xs: 0, sm: 600, md: 900, lg: 1200, xl: 1536`).

**Palette:**

| Token                | Light     | Dark      |
| -------------------- | --------- | --------- |
| `primary.main`       | `#1565c0` | `#1565c0` |
| `secondary.main`     | `#df2a2a` | `#df2a2a` |
| `background.default` | `#fafafa` | `#22242a` |
| `background.paper`   | `#ffffff` | `#27292e` |

**Component overrides:**

- `MuiSvgIcon`: Icon color is `white` in dark mode, `black` in light mode.
- `MuiButtonBase`: Touch ripple disabled globally.
- `MuiButton`: `textTransform: none`, `borderRadius: 8`.
- `MuiFormHelperText`: No margin, no text wrapping, `0.75rem`.
- `MuiTextField`: Overrides `:-webkit-autofill` to preserve transparent background and avoid the browser's yellow autofill flash.

### 8.9 Form Validation

**Zod schemas (`components/auth/Schemas.ts`):**

```ts
emailSchema = z.email().max(100);

passwordSchema = z
  .string()
  .regex(/[A-Z]/) // uppercase
  .regex(/[a-z]/) // lowercase
  .regex(/[0-9]/) // digit
  .regex(/[#?!@$%^&\-._]/) // special char
  .regex(/^[A-Za-z0-9#?!@$%^&\-._]+$/) // only allowed chars
  .min(8)
  .max(64);
```

Per-route schemas compose these base schemas. Validation is triggered per step using `methods.trigger(currentStep)` in `useSignUp`.

**OTP field:** Validated with `z.string().trim().length(6)` using the `MuiOtpInput` component which enforces numeric entry via `inputMode="numeric"`.

**Password requirements component:** Independently evaluates 5 regex rules against a debounced (500 ms) password value and renders a live checklist with ✓/✗ icons in green/red.

### 8.10 Build & Dev Tooling

**`vite.config.ts`:**

- `tanstackRouter({ target: "react", autoCodeSplitting: true })` – generates `routeTree.gen.ts` and enables per-route lazy loading.
- `react()` – Vite React plugin (Fast Refresh, JSX transform).
- `mkcert()` – generates locally trusted HTTPS certificate so cookies with `Secure` flag work in development.
- Path alias `@` → `./src`.

**Scripts:**

```json
"dev":     "vite --port 3000 --host"
"build":   "tsc -b && vite build"
"lint":    "eslint ."
"preview": "vite preview --port 3001 --host"
```

**TypeScript:** `tsconfig.app.json` and `tsconfig.node.json` (split config for app and Vite node context). `tsconfig.json` references both.

---

## 9. End-to-End Data Flows

### 9.1 User Registration Flow

```
Browser                    WebServer                    MlServer     Email Provider
  │                            │                            │              │
  │  POST /api/sign-up/start   │                            │              │
  │  { email }                 │                            │              │
  │─────────────────────────▶  │                            │              │
  │                            │ Check DB: email exists?    │              │
  │                            │ Create 6-digit OTP         │              │
  │                            │ SendOtpEmailAsync ────────────────────────▶│
  │                            │                            │   OTP email  │
  │  200 { otpExpiresAt }      │                            │              │
  │◀─────────────────────────  │                            │              │
  │                            │                            │              │
  │  POST /api/sign-up/        │                            │              │
  │    verify-otp              │                            │              │
  │  { email, otp }            │                            │              │
  │─────────────────────────▶  │                            │              │
  │                            │ Validate OTP from cache    │              │
  │                            │ Mark email verified        │              │
  │  204 No Content            │                            │              │
  │◀─────────────────────────  │                            │              │
  │                            │                            │              │
  │  POST /api/sign-up/        │                            │              │
  │    complete                │                            │              │
  │  { email, password }       │                            │              │
  │─────────────────────────▶  │                            │              │
  │                            │ Verify email verified flag │              │
  │                            │ Hash password              │              │
  │                            │ Create user + token in DB  │              │
  │                            │ Issue JWT + refresh token  │              │
  │  204 + Set-Cookie          │                            │              │
  │    accessToken (15m)       │                            │              │
  │    __Secure-refreshToken   │                            │              │
  │◀─────────────────────────  │                            │              │
  │ Navigate to /              │                            │              │
```

### 9.2 User Login Flow

```
Browser                    WebServer
  │                            │
  │  POST /api/login           │
  │  { identifier, password }  │
  │─────────────────────────▶  │
  │                            │ Find user by email in DB
  │                            │ Verify password hash
  │                            │ Create JWT access token
  │                            │ Create refresh token, store hash in DB
  │  204 + Set-Cookie          │
  │    accessToken (15m)       │
  │    __Secure-refreshToken   │
  │◀─────────────────────────  │
  │ Navigate to /              │
```

### 9.3 Token Refresh Flow

```
Browser                    WebServer
  │                            │
  │  [any 401 response]        │
  │                            │
  │  POST /api/auth/           │
  │    refresh-token           │
  │  Cookie: __Secure-         │
  │    refreshToken            │
  │─────────────────────────▶  │
  │                            │ Hash incoming token
  │                            │ Find in DB, load user
  │                            │ Generate new access + refresh tokens
  │                            │ Update DB row (token rotation)
  │  204 + Set-Cookie (new     │
  │    tokens)                 │
  │◀─────────────────────────  │
  │  Retry original request    │
```

### 9.4 Resume Analysis Flow

```
Browser                    WebServer                    MlServer
  │                            │                            │
  │  POST /api/analyse-resume  │                            │
  │  multipart/form-data:      │                            │
  │    file (bytes)            │                            │
  │    fileName (string)       │                            │
  │    jobDescription (string) │                            │
  │  Cookie: accessToken       │                            │
  │─────────────────────────▶  │                            │
  │                            │ Validate JWT cookie        │
  │                            │ Read file into byte[]      │
  │                            │                            │
  │                            │  gRPC AnalyzeResume ──────▶│
  │                            │  AnalyseResumeRequest:     │
  │                            │    file: bytes             │
  │                            │    file_name               │
  │                            │    job_description         │
  │                            │                            │ Detect file extension
  │                            │                            │ FileParser.extract_text()
  │                            │                            │ GitHubModelsClient
  │                            │                            │   .analyze_resume()
  │                            │                            │   → POST models.inference.ai.azure.com
  │                            │                            │   ← JSON { score, feedback, ... }
  │                            │◀──────────────────────────│
  │                            │  AnalyseResumeResponse     │
  │                            │                            │
  │  200 { status,             │                            │
  │    matchScore,             │                            │
  │    feedback,               │                            │
  │    missingKeywords,        │                            │
  │    skillsAnalysis }        │                            │
  │◀─────────────────────────  │                            │
  │ Display AnalysisResults    │                            │
```

---

## 10. Security Design

### Authentication

- **JWT access tokens** stored in `HttpOnly` cookies — inaccessible to JavaScript, preventing XSS-based token theft.
- **Refresh tokens** stored in `HttpOnly; Secure; SameSite=Strict` cookies scoped to `/api/auth/refresh-token` — the most restrictive possible configuration, preventing CSRF and limiting exposure.
- **Refresh tokens are hashed** (SHA-256) before database storage — a compromised database does not expose valid tokens.
- **Token rotation** on every refresh — old refresh tokens are immediately invalidated.
- **Access token lifetime: 15 minutes** — limits the window of exposure for stolen tokens.

### Password Security

- Passwords are hashed with **`PasswordHasher<T>`** (ASP.NET Core's built-in implementation using PBKDF2 with SHA-256, 128-bit salt, 100,000 iterations by default).
- Generic `"Invalid email or password"` error messages on failed login — prevents **user enumeration**.

### OTP Security

- OTPs use `CryptoRandom` (CSPRNG) — not `System.Random`.
- OTPs expire after **5 minutes**.
- OTPs are **single-use** — removed from cache after successful verification.
- Purpose-scoped cache keys (`otp_{purpose}_{email}`) prevent OTPs from one flow being reused in another.

### CORS

- Allowed origins are explicitly enumerated (not `*`).
- `AllowCredentials()` is required for cookie transport.
- CORS middleware is only active in Development.

### Input Validation

- DTOs use `[Required]`, `[EmailAddress]`, `[Length]` data annotations for basic validation.
- The frontend applies Zod schemas with detailed rules (email format, password complexity, OTP length).
- Resume file type is restricted to PDF/DOC/DOCX on both client (MIME + extension) and effectively on the server (FileParser returns empty string for unknown types).
- File size is limited to **10 MB** on the client side.

### gRPC Channel

- The MlServer gRPC channel is **insecure** (no TLS). This is acceptable only in a trusted internal network or local development. In production, mutual TLS or a service mesh should be used.

---

## 11. Cross-Cutting Concerns

### Error Handling Strategy

- **Service layer:** Returns `Result` / `Result<T>` values — never throws for expected failures.
- **Controller layer:** Uses `result.ToActionResult()` to convert results to HTTP responses — no try/catch needed in controllers.
- **MlServer:** Catches all exceptions, logs them, sets gRPC `INTERNAL` status, and returns an empty response.
- **Frontend:** `useServerError` extracts the `message` field from error responses and auto-clears after 10 seconds.

### Dependency Injection

All services are registered via static extension methods on `IServiceCollection`:

- `AddDatabases(config)`
- `AddAuthServices(config)`
- `AddEmailServices(env)`
- `AddResumeAnalysisServices(config)`

Services are scoped to the HTTP request lifetime (`AddScoped`) unless otherwise noted.

### Logging

- ASP.NET Core's built-in logging is configured via `appsettings.json`.
- MlServer uses Python `print()` statements for diagnostic output.
- No structured logging framework is currently in use.

### Responsive Design

- The `BreakpointProvider` tracks a single `isDesktop` boolean (breakpoint: `md` / 900 px).
- Below `md`: mobile navbar (hamburger drawer, compact toolbar height: `2.75rem`).
- At `md` and above: desktop navbar (inline buttons, toolbar height: `3.75rem`).
- Main content area height is computed with `calc(100dvh - navbarHeight)` to fill the viewport.
- Auth forms are full-height on mobile (`minHeight: 100dvh`) and vertically centered on desktop.

### Code-Splitting & Performance

- TanStack Router's `autoCodeSplitting` generates separate JS chunks per route, loaded on demand.
- TanStack Query's `staleTime: 15 * 60 * 1000` on the user-details query prevents redundant network calls during the access token's validity window.
- Axios response interceptor queues concurrent requests during token refresh, preventing multiple simultaneous refresh attempts.

### Development Tooling

- `vite-plugin-mkcert` creates a locally trusted TLS certificate so the frontend runs on HTTPS in development — required for the `Secure` cookie attribute to work.
- `mkcert` certificates are gitignored (`cert/`).
- Environment-specific `appsettings.*.json` files (Development, Production, Staging) are all gitignored; only the base `appsettings.json` is committed.
- Python `__pycache__/`, `.venv/`, and virtual environment directories are gitignored.
- Database migration files are gitignored and generated locally with `dotnet ef migrations add`.
