# File & Media Storage Architecture

## Purpose

Project Glacier will eventually manage significant volumes of documents, photographs and other uploaded files.

Examples include:

- digital waiver evidence
- signed waiver documents
- maintenance photographs
- inspection photographs
- incident photographs
- equipment photographs
- operational attachments
- customer-support attachments
- exported reports
- future documents and media

This data must be stored in a way that is secure, scalable, performant and cost-effective.

---

## Core Principle

Large files should not normally be stored directly in PostgreSQL.

PostgreSQL should store:

- structured business records
- relationships
- metadata
- storage references
- file status
- ownership
- timestamps
- audit information

Dedicated object storage should store:

- images
- PDFs
- uploaded documents
- large binary files
- generated evidence files

This separation protects database performance and allows file storage to scale independently from transactional data.

---

## Target Architecture

The intended production model is:

User / Staff Device

↓

Glacier API authorises upload

↓

Temporary signed upload permission

↓

Direct upload to private Object Storage

↓

Object Storage confirms upload

↓

Glacier stores file metadata and relationship in PostgreSQL

For file viewing:

User / Staff Device

↓

Glacier verifies authorisation

↓

Short-lived signed access URL or authorised CDN delivery

↓

Private Object Storage

Files should not normally need to pass through the Glacier API application server after authorisation.

---

## Object Storage

Glacier should use managed cloud object storage or a compatible equivalent.

Potential technologies include:

- Amazon S3
- Azure Blob Storage
- Google Cloud Storage
- another reputable S3-compatible managed provider

The final provider should be chosen during infrastructure planning.

Selection criteria should include:

- Australian region availability
- data residency requirements
- security controls
- encryption
- signed URL support
- lifecycle policies
- versioning
- availability
- CDN integration
- backup/recovery options
- monitoring
- cost
- developer tooling

---

## Australian Data Residency

Because Glacier will store Australian customer, participant and operational information, data-location decisions must be intentional.

Where commercially and technically practical, production storage should use Australian cloud regions.

Data residency requirements should be reviewed as part of Glacier's privacy and compliance framework.

This includes reviewing where:

- primary database data is stored
- object storage is hosted
- backups are stored
- logs are stored
- CDN caches may exist
- third-party processors store or process information

Final requirements must be checked against applicable contractual, privacy and legal obligations.

---

## Database Metadata Model

Files should be represented in PostgreSQL using metadata records rather than binary file contents.

A generic model may ultimately resemble:

`FileAsset`

with fields such as:

- `id`
- `organizationId`
- `eventId`
- `storageProvider`
- `storageBucket`
- `storageKey`
- `originalFilename`
- `displayName`
- `mimeType`
- `fileSize`
- `checksum`
- `status`
- `createdByUserId`
- `createdAt`
- `updatedAt`
- `deletedAt`

Feature-specific records may reference the FileAsset.

Examples:

`MaintenancePhoto`
→ `fileAssetId`

`WaiverDocument`
→ `fileAssetId`

`IncidentAttachment`
→ `fileAssetId`

This avoids implementing a separate storage mechanism for every Glacier module.

---

## Tenant Isolation

Files are Organisation-owned resources.

Every FileAsset must be attributable to an Organisation.

File access must enforce the same multi-tenant isolation principles as Glacier's structured data.

Knowing or guessing a storage key must never grant access to another Organisation's files.

Public buckets should not be used for private Glacier customer or operational files.

---

## Private-by-Default Storage

Uploaded Glacier files should be private by default.

Access should be granted only after Glacier verifies the user's permission to access the underlying business resource.

Examples:

- maintenance photo → user must have access to the relevant maintenance record
- waiver evidence → user must have appropriate access to the Booking / Participant / waiver
- incident photo → user must have permission to access the incident
- customer attachment → access should be restricted to authorised support/administrative roles

---

## Signed Access URLs

Private files may be delivered using short-lived signed URLs.

A typical workflow:

1. Client requests access from Glacier.
2. Glacier verifies authentication and authorisation.
3. Glacier creates a short-lived signed object-storage URL.
4. Client downloads or displays the file directly from storage.
5. Signed URL expires automatically.

Signed URLs should:

- expire quickly
- be scoped to a single file/object
- not expose storage credentials
- only be issued after server-side access checks

---

## Direct Uploads

Large uploads should preferably travel directly from the user's device to object storage.

The preferred workflow:

1. Client tells Glacier what it intends to upload.
2. Glacier validates:
   - user permission
   - file category
   - expected MIME type
   - expected size
3. Glacier returns a short-lived signed upload URL.
4. Client uploads directly to object storage.
5. Glacier records or confirms upload completion.
6. File becomes available to the relevant business record.

This prevents Glacier API servers from becoming a bottleneck for large photographs and documents.

---

## Upload Validation

Uploads must be validated.

Controls should include:

- maximum file size
- allowed MIME types
- allowed extensions
- safe filename handling
- content-type verification where practical
- image validation
- checksum validation where useful
- malware scanning where appropriate
- limits on upload frequency
- Organisation ownership verification

A client-provided filename or MIME type must not be treated as inherently trustworthy.

---

## File Size Limits

Glacier should define file-size limits by upload category.

Illustrative examples:

### Maintenance Photos

Typical limit:

5–15 MB per image

### Waiver PDFs

Typical limit:

2–10 MB

### General Documents

Limit based on supported operational use.

Actual limits should be decided during each feature phase rather than applying one arbitrary global maximum.

Very large file types such as video should require an explicit architectural decision before being supported.

---

## Image Optimisation

Original maintenance and operational photographs may be large.

Glacier should avoid loading original high-resolution images unnecessarily.

The intended image pipeline should support:

- original image preservation where required
- image orientation correction
- compressed display version
- thumbnail generation
- optional medium-resolution version
- metadata extraction where appropriate

Example:

Original:

`4032 × 3024`
`3–8 MB`

Thumbnail:

approximately `400 × 300`
approximately `30–100 KB`

Dashboard and list views should normally display thumbnails.

Full-resolution originals should be loaded only when requested.

---

## Thumbnail Generation

Thumbnail generation should occur asynchronously where practical.

Potential workflow:

Original uploaded

↓

Storage event / background job

↓

Image processor

↓

Thumbnail created

↓

Metadata updated

This keeps the initial upload workflow responsive.

The application should handle temporary states such as:

- uploaded
- processing
- ready
- failed

---

## CDN Delivery

Frequently viewed images and other suitable assets should eventually be delivered using a Content Delivery Network.

The CDN may improve:

- latency
- image-loading speed
- bandwidth efficiency
- object-storage load
- user experience

Private media must remain access controlled.

A CDN must not convert private Glacier files into uncontrolled public resources.

The selected implementation may use:

- signed CDN URLs
- signed cookies
- private origins
- short-lived authorised links

depending on infrastructure choice.

---

## Pagination and Lazy Loading

File-heavy screens must not load entire file collections at once.

Examples:

Maintenance history should use:

- pagination
- date filters
- asset filters
- Event filters
- task filters
- lazy image loading

A page should never attempt to load every photograph ever associated with an Event or Organisation.

This design keeps performance stable as Glacier grows.

---

## Waiver Storage

Waivers require both structured data and immutable evidence.

PostgreSQL should store structured acceptance information such as:

- waiver version
- Booking
- Participant
- guardian/signatory
- acceptance timestamp
- acceptance status
- audit metadata

Object storage may store:

- immutable generated PDF/evidence copy
- signed waiver document where required
- related evidence attachments

The exact waiver-storage model will be defined during the Waiver phase after the current operational waiver template is reviewed.

---

## Maintenance Photos

Maintenance and inspection workflows are expected to create significant image volume.

A future maintenance-photo model should support:

- maintenance-task relationship
- Organisation
- Event
- asset/equipment relationship
- uploader
- timestamp
- notes/caption
- original image
- thumbnail
- processing status
- optional location metadata where operationally justified
- retention classification

Maintenance screens should display optimised thumbnails by default.

---

## Photo Privacy

Operational photographs may unintentionally contain:

- customers
- children
- staff
- vehicle registrations
- documents
- identifying information
- surrounding private areas

Maintenance workflows should instruct staff to avoid capturing unnecessary personal information.

Access to operational photographs should be restricted to users who require them.

Photo retention should be based on operational, safety, insurance and legal requirements rather than unlimited storage by default.

---

## Metadata Privacy

Image metadata may contain sensitive information.

Examples include:

- GPS coordinates
- device information
- timestamps
- camera identifiers

Glacier should make an explicit decision about whether metadata such as EXIF GPS information is required.

Unnecessary metadata should be removed from derived/display versions where appropriate.

Original evidence files may require different treatment where metadata has legitimate evidentiary value.

---

## Storage Lifecycle

Object storage should use lifecycle policies where appropriate.

Example lifecycle:

### Active Storage

Recent operational files requiring immediate access.

### Lower-Cost Storage

Older files that remain operationally useful but are rarely accessed.

### Archive Storage

Long-term records required for legal, insurance or historical purposes.

### Deletion

Files reaching the end of their approved retention period.

Lifecycle rules must align with Glacier's privacy and retention framework.

---

## Storage Tiers

Cloud storage providers commonly provide multiple storage classes.

Glacier may use different classes depending on expected access frequency.

The platform should avoid premature optimisation, but architecture should allow older data to move to less expensive storage without changing business relationships in PostgreSQL.

The database storage reference should remain stable even if the underlying storage tier changes.

---

## Retention

File retention should be determined by file category.

Examples:

- waiver evidence
- maintenance photographs
- inspection evidence
- incident evidence
- temporary uploads
- generated reports

Each category should eventually have:

- retention period
- archive policy
- deletion policy
- legal hold capability where required

Files should not simply be retained forever because cloud storage is inexpensive.

---

## Soft Delete

Where appropriate, Glacier may initially soft-delete file metadata.

Example:

`deletedAt`

This allows:

- user recovery
- audit tracking
- delayed physical deletion
- safe dependency handling

Physical object deletion may occur after a configured recovery window.

Some regulated/evidentiary records may require different rules.

---

## Orphan File Prevention

Glacier should prevent files from remaining indefinitely in storage without a valid database relationship.

Example:

A user requests an upload URL but abandons the form.

The uploaded object may never become attached to a maintenance task.

A scheduled cleanup process should identify and delete temporary/orphaned uploads after an appropriate period.

---

## Versioning

Object-storage versioning may be appropriate for selected file categories.

Benefits may include:

- recovery from accidental deletion
- protection from accidental overwrite
- improved forensic capability

Versioning increases storage consumption and should be configured intentionally.

Business records should not silently overwrite immutable evidence.

---

## Immutable Evidence

Some file categories may need immutable or effectively immutable treatment.

Potential examples:

- accepted waiver evidence
- signed legal documents
- final incident evidence
- final compliance records

Where required, Glacier should create a new file/version rather than altering the evidence originally associated with a completed record.

---

## Malware Protection

Uploaded documents can introduce security risk.

Where appropriate, Glacier should support malware scanning before files become available to other users.

Potential workflow:

Upload

↓

Quarantine / pending state

↓

Malware scan

↓

Clean → READY

or

Infected → REJECTED

Images may also require content/file validation even if document malware risk is lower.

---

## Storage Monitoring

Glacier should monitor storage usage.

Metrics should eventually include:

- total object count
- total storage size
- storage by Organisation
- storage by file category
- monthly upload volume
- failed upload count
- processing failures
- orphan files
- unusually large files

Operational alerts should detect unexpected growth or failures.

---

## Organisation Storage Usage

Glacier's multi-tenant architecture should allow storage usage to be measured by Organisation.

Example:

Organisation: Ice Rinks Australia

- Documents: 12 GB
- Waiver evidence: 28 GB
- Maintenance photos: 240 GB
- Incident media: 8 GB
- Archived media: 95 GB

This may later support:

- subscription storage allowances
- overage pricing
- cost attribution
- abuse detection
- Organisation reporting

---

## Capacity Planning

Object storage should be considered effectively scalable for Glacier's foreseeable use, but cost and performance still require management.

Illustrative annual volume:

- 100,000 waiver documents at 400 KB
  → approximately 40 GB

- 200,000 maintenance photographs at 2.5 MB
  → approximately 500 GB

These volumes are routine for managed object-storage platforms.

The architecture should therefore optimise for:

- secure access
- fast retrieval
- efficient thumbnails
- lifecycle cost
- monitoring

rather than attempting to minimise file count.

---

## Database Performance

File binaries should not inflate the transactional PostgreSQL database.

PostgreSQL performance should be protected through:

- metadata-only file records
- appropriate indexes
- pagination
- efficient relationship queries
- avoiding unbounded joins
- avoiding large binary columns
- archiving where appropriate

Bookings, Tickets, Customers and operational records should remain fast even as media volume grows.

---

## Backup Strategy

Object storage is not itself a complete backup strategy.

Glacier should consider:

- object versioning where appropriate
- accidental deletion protection
- provider resilience
- backup copies for critical evidence categories where justified
- recovery procedures
- database/object consistency

PostgreSQL backups and object-storage recovery must be considered together.

A database restored to an earlier point in time may otherwise reference files that have changed or been removed.

---

## Recovery Testing

Storage recovery should be tested before production reliance.

Tests should eventually include:

- restore a database backup
- recover a deleted file where supported
- verify signed access after restoration
- verify metadata/object relationships
- test recovery of critical waiver or operational evidence

Recovery processes should be documented.

---

## Security

File storage must follow the controls defined in:

`docs/architecture/SECURITY_PRIVACY_AND_COMPLIANCE.md`

Key requirements include:

- tenant isolation
- private storage
- encryption
- short-lived signed access
- least privilege
- secure credentials
- auditability
- retention
- safe deletion
- incident response

---

## Performance Principles

File-heavy Glacier features should follow these rules:

1. Do not store large files in PostgreSQL.
2. Upload directly to object storage where practical.
3. Do not proxy normal file downloads through the API.
4. Use thumbnails for lists.
5. Lazy-load media.
6. Paginate large record sets.
7. Use a CDN where appropriate.
8. Cache safely.
9. Process expensive image operations asynchronously.
10. Monitor performance and storage growth.

These principles allow Glacier to scale to large file volumes without degrading normal Booking and operational workflows.

---

## Implementation Timing

The architecture should exist before file-heavy modules are built.

Actual object-storage implementation should occur when required by the first feature that depends on it.

Likely trigger phases include:

- Waivers
- Maintenance
- Incidents
- document attachments

This avoids prematurely implementing infrastructure while ensuring those modules do not create incompatible storage patterns.

---

## Future Capabilities

The architecture should remain compatible with future features such as:

- customer document uploads
- supplier documents
- asset manuals
- maintenance evidence
- incident evidence
- staff qualifications
- venue documentation
- downloadable reports
- marketing assets
- event photo libraries
- AI-assisted image analysis

Any new file category must define:

- ownership
- access rules
- retention
- security classification
- upload limits
- allowed types
- processing requirements

before production use.

---

## Architectural Decision

Glacier will separate transactional data from large binary file storage.

PostgreSQL is the source of truth for structured metadata and business relationships.

Private cloud object storage is the source of truth for file content.

This is the default architecture unless a future feature has a documented reason to use a different model.