# Stock Opname API Documentation

## Base URL

```
http://localhost:3000/api/stock-opname
```

## Endpoints

### 1. Create Session

Create a new stock opname session with PIC profile.

**Endpoint:** `POST /sessions`

**Request Body:**

```json
{
  "picName": "Ahmad Rizki",
  "rooms": ["Ruang Referensi", "Ruang Koleksi Umum"],
  "classNumbers": ["000-099", "100-199", "200-299"],
  "statusBuku": ["Tersedia", "Dipinjam"]
}
```

**Response:** `201 Created`

```json
{
  "success": true,
  "message": "Session created successfully",
  "data": {
    "id": 1,
    "picName": "Ahmad Rizki",
    "rooms": ["Ruang Referensi", "Ruang Koleksi Umum"],
    "classNumbers": ["000-099", "100-199", "200-299"],
    "statusBuku": ["Tersedia", "Dipinjam"],
    "status": "active"
  }
}
```

---

### 2. Add Item to Session

Add a scanned book item to an existing session.

**Endpoint:** `POST /sessions/:sessionId/items`

**Request Body:**

```json
{
  "barcode": "00000028093",
  "title": "Pengantar Ilmu Komputer",
  "author": "John Doe",
  "callNumber": "004 DOE p",
  "year": "2020",
  "typeProcurement": "Pembelian",
  "source": "Toko Buku ABC",
  "location": "Ruang Koleksi Umum",
  "statusBuku": "Tersedia",
  "hasWarning": false,
  "warningTypes": [],
  "forcedAdd": false
}
```

**Response:** `201 Created`

```json
{
  "success": true,
  "message": "Item added successfully",
  "data": {
    "id": 1,
    "sessionId": 1,
    "barcode": "00000028093",
    "title": "Pengantar Ilmu Komputer",
    "author": "John Doe",
    "callNumber": "004 DOE p",
    "year": "2020",
    "typeProcurement": "Pembelian",
    "source": "Toko Buku ABC",
    "location": "Ruang Koleksi Umum",
    "statusBuku": "Tersedia",
    "hasWarning": false,
    "warningTypes": [],
    "forcedAdd": false
  }
}
```

**Example with Warning:**

```json
{
  "barcode": "00000028094",
  "title": "Matematika Dasar",
  "author": "Jane Smith",
  "callNumber": "510 SMI m",
  "year": "2019",
  "typeProcurement": "Hibah",
  "source": "Perpustakaan Nasional",
  "location": "Ruang Referensi",
  "statusBuku": "Rusak",
  "hasWarning": true,
  "warningTypes": ["statusMismatch"],
  "forcedAdd": true
}
```

---

### 3. Get Session by ID

Retrieve a specific session with all its scanned items.

**Endpoint:** `GET /sessions/:sessionId`

**Response:** `200 OK`

```json
{
  "success": true,
  "data": {
    "id": 1,
    "picName": "Ahmad Rizki",
    "rooms": ["Ruang Referensi", "Ruang Koleksi Umum"],
    "classNumbers": ["000-099", "100-199", "200-299"],
    "statusBuku": ["Tersedia", "Dipinjam"],
    "status": "active",
    "createdAt": "2026-01-22T07:00:00.000Z",
    "updatedAt": "2026-01-22T07:00:00.000Z",
    "totalItems": 2,
    "items": [
      {
        "id": 2,
        "sessionId": 1,
        "barcode": "00000028094",
        "title": "Matematika Dasar",
        "author": "Jane Smith",
        "callNumber": "510 SMI m",
        "year": "2019",
        "typeProcurement": "Hibah",
        "source": "Perpustakaan Nasional",
        "location": "Ruang Referensi",
        "statusBuku": "Rusak",
        "hasWarning": true,
        "warningTypes": ["statusMismatch"],
        "forcedAdd": true,
        "scannedAt": "2026-01-22T07:05:00.000Z"
      },
      {
        "id": 1,
        "sessionId": 1,
        "barcode": "00000028093",
        "title": "Pengantar Ilmu Komputer",
        "author": "John Doe",
        "callNumber": "004 DOE p",
        "year": "2020",
        "typeProcurement": "Pembelian",
        "source": "Toko Buku ABC",
        "location": "Ruang Koleksi Umum",
        "statusBuku": "Tersedia",
        "hasWarning": false,
        "warningTypes": [],
        "forcedAdd": false,
        "scannedAt": "2026-01-22T07:02:00.000Z"
      }
    ]
  }
}
```

---

### 4. Get All Sessions

Retrieve all sessions with pagination.

**Endpoint:** `GET /sessions`

**Query Parameters:**

- `page` (optional, default: 1) - Page number
- `limit` (optional, default: 10) - Items per page

**Example:** `GET /sessions?page=1&limit=10`

**Response:** `200 OK`

```json
{
  "success": true,
  "data": [
    {
      "id": 2,
      "picName": "Siti Nurhaliza",
      "rooms": ["Ruang Anak"],
      "classNumbers": ["300-399"],
      "statusBuku": ["Tersedia"],
      "status": "completed",
      "createdAt": "2026-01-22T08:00:00.000Z",
      "updatedAt": "2026-01-22T09:00:00.000Z",
      "totalItems": 15
    },
    {
      "id": 1,
      "picName": "Ahmad Rizki",
      "rooms": ["Ruang Referensi", "Ruang Koleksi Umum"],
      "classNumbers": ["000-099", "100-199", "200-299"],
      "statusBuku": ["Tersedia", "Dipinjam"],
      "status": "active",
      "createdAt": "2026-01-22T07:00:00.000Z",
      "updatedAt": "2026-01-22T07:00:00.000Z",
      "totalItems": 2
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 2,
    "totalPages": 1
  }
}
```

---

### 5. Complete Session

Mark a session as completed.

**Endpoint:** `PATCH /sessions/:sessionId/complete`

**Response:** `200 OK`

```json
{
  "success": true,
  "message": "Session completed successfully"
}
```

---

### 6. Delete Session

Delete a session and all its items.

**Endpoint:** `DELETE /sessions/:sessionId`

**Response:** `200 OK`

```json
{
  "success": true,
  "message": "Session deleted successfully"
}
```

---

## Error Responses

### 400 Bad Request

```json
{
  "success": false,
  "message": "Missing required fields: picName, rooms, classNumbers, statusBuku"
}
```

### 404 Not Found

```json
{
  "success": false,
  "message": "Session not found"
}
```

### 500 Internal Server Error

```json
{
  "success": false,
  "message": "Failed to create session",
  "error": "Error details here"
}
```

---

## Database Schema

### stock_opname_sessions

```sql
CREATE TABLE stock_opname_sessions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    pic_name VARCHAR(255) NOT NULL,
    rooms JSON NOT NULL,
    class_numbers JSON NOT NULL,
    status_buku JSON NOT NULL,
    status ENUM('active', 'completed') DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

### stock_opname_items

```sql
CREATE TABLE stock_opname_items (
    id INT AUTO_INCREMENT PRIMARY KEY,
    session_id INT NOT NULL,
    barcode VARCHAR(50) NOT NULL,
    title TEXT,
    author TEXT,
    call_number VARCHAR(100),
    year VARCHAR(20),
    type_procurement VARCHAR(100),
    source VARCHAR(100),
    location VARCHAR(255),
    status_buku VARCHAR(100),
    has_warning BOOLEAN DEFAULT FALSE,
    warning_types JSON,
    forced_add BOOLEAN DEFAULT FALSE,
    scanned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (session_id) REFERENCES stock_opname_sessions(id) ON DELETE CASCADE
);
```

---

## Integration Example

### Frontend Integration (React/TypeScript)

```typescript
// Create session when PIC submits profile
const createSession = async () => {
  const response = await fetch(
    "http://localhost:3000/api/stock-opname/sessions",
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        picName: picProfile.name,
        rooms: picProfile.rooms,
        classNumbers: picProfile.classNumbers,
        statusBuku: picProfile.statusBuku,
      }),
    },
  );

  const result = await response.json();
  const sessionId = result.data.id;

  // Store sessionId in state
  setCurrentSessionId(sessionId);
};

// Add item when book is scanned
const addScannedItem = async (bookData, validation) => {
  await fetch(
    `http://localhost:3000/api/stock-opname/sessions/${currentSessionId}/items`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        barcode: bookData.barcode,
        title: bookData.title,
        author: bookData.author,
        callNumber: bookData.call_number,
        year: bookData.year,
        typeProcurement: bookData.type_procurement,
        source: bookData.source,
        location: bookData.location,
        statusBuku: bookData.status_buku,
        hasWarning: !validation.isValid,
        warningTypes: getWarningTypes(validation),
        forcedAdd: validation.forcedAdd || false,
      }),
    },
  );
};

// Complete session when done
const completeSession = async () => {
  await fetch(
    `http://localhost:3000/api/stock-opname/sessions/${currentSessionId}/complete`,
    {
      method: "PATCH",
    },
  );
};
```
