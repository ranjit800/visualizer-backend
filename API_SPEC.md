# Visualizer — Configuration API Spec

## Overview
Standalone Express/Node stub server for the Save & Share configuration endpoint.
- Base URL (stub): `http://localhost:4000`
- Base URL (Next.js built-in): `http://localhost:3000`
- Data file: `data/configurations.json`

---

## Endpoints

### `POST /api/configurations`
Save a new product configuration and get back a shareable ID.

**Request Body**
```json
{
  "productSlug":    "aurora-chair",
  "materials":      { "primary": "#f97316" },
  "components":     { "cushion": true, "armrest": false },
  "lightingPreset": "daylight",
  "exposure":       1.4,
  "camera":         { "azimuth": 0, "elevation": 45, "distance": 4 },
  "name":           "My Orange Chair"
}
```

| Field | Type | Required | Description |
|---|---|---|---|
| `productSlug` | string | ✅ | Slug of the product (must match a product in `lib/products.ts`) |
| `materials` | object | — | Map of part ID → hex color string |
| `components` | object | — | Map of accessory ID → boolean (on/off) |
| `lightingPreset` | string | — | `"studio"` \| `"daylight"` \| `"warm"` |
| `exposure` | number | — | Exposure value (0.4 – 2.0) |
| `camera` | object | — | Camera state: azimuth, elevation, distance |
| `name` | string | — | Optional label for the configuration |

**Response `201 Created`**
```json
{
  "id": "a1b2c3d4e5f6g7h8",
  "shareUrl": "http://localhost:3000/share/a1b2c3d4e5f6g7h8"
}
```

**Response `400 Bad Request`**
```json
{ "error": "productSlug is required and must be a string" }
```

---

### `GET /api/configurations`
List all saved configurations.

**Response `200 OK`**
```json
{
  "count": 2,
  "configs": [
    {
      "id": "a1b2c3d4e5f6g7h8",
      "productSlug": "aurora-chair",
      "materials": { "primary": "#f97316" },
      "lightingPreset": "daylight",
      "exposure": 1.4,
      "createdAt": "2026-02-28T12:30:00.000Z"
    }
  ]
}
```

---

### `GET /api/configurations/:id`
Fetch one saved configuration by ID.

**Response `200 OK`**
```json
{
  "id": "a1b2c3d4e5f6g7h8",
  "productSlug": "aurora-chair",
  "materials": { "primary": "#f97316" },
  "components": { "cushion": true, "armrest": false },
  "lightingPreset": "daylight",
  "exposure": 1.4,
  "camera": { "azimuth": 0, "elevation": 45, "distance": 4 },
  "createdAt": "2026-02-28T12:30:00.000Z",
  "name": "My Orange Chair"
}
```

**Response `404 Not Found`**
```json
{ "error": "Configuration not found", "id": "a1b2c3d4e5f6g7h8" }
```

---

### `DELETE /api/configurations/:id`
Delete a saved configuration by ID.

**Response `200 OK`**
```json
{ "message": "Deleted", "id": "a1b2c3d4e5f6g7h8" }
```

**Response `404 Not Found`**
```json
{ "error": "Configuration not found" }
```

---

### `GET /health`
Health check.

**Response `200 OK`**
```json
{ "status": "ok", "timestamp": "2026-02-28T12:00:00.000Z", "port": 4000 }
```

---

## Running the Stub Server

```bash
cd server
node index.js
# Server starts on http://localhost:4000
```

## Quick cURL Examples

```bash
# Save a configuration
curl -X POST http://localhost:4000/api/configurations \
  -H "Content-Type: application/json" \
  -d '{"productSlug":"aurora-chair","materials":{"primary":"#f97316"},"lightingPreset":"daylight","exposure":1.4}'

# Get a config by ID
curl http://localhost:4000/api/configurations/a1b2c3d4e5f6g7h8

# List all
curl http://localhost:4000/api/configurations

# Delete
curl -X DELETE http://localhost:4000/api/configurations/a1b2c3d4e5f6g7h8
```
