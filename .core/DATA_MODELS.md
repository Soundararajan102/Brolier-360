# Data Models & Core Functions

## Data Models Changes Log
*Note: Each time the data models change, append the change in this section with a timestamp. NEVER overwrite historical models.*

### [2026-06-22 10:00:00] Initial Brolier 360 Models (FastAPI/SQLAlchemy)

### [2026-07-04 21:52:48] High-Performance Indexes & Cascading Deletes
- Added B-Tree indexes (`index=True`) to critical fields across models to eliminate full-table scans during Meta webhook lookups and API filtering:
  - `CampaignMember`: `wa_message_id`, `delivery_status`, `read_status`
  - `Campaign`: `status`
  - `Member`: `status`, `membership_type`
  - `ChatMessage`: `status`, `direction`, `message_type`
  - `Template`: `status`, `category`
- Implemented database-level data integrity by adding `ondelete="CASCADE"` to foreign keys (`member_id`, `campaign_id`) in junction and history tables, preventing orphan records when parent entities are deleted.

## Database Operations (SQLAlchemy)
All database interactions are handled via SQLAlchemy ORM.

### Key Components
- `app/core/database.py`: Contains the `SessionLocal` sessionmaker and the `Base` declarative class.
- `app/models/`: Directory containing all SQLAlchemy models.

### Common Operations
- **Querying**: `db.query(Model).filter(...)`
- **Inserting**: `db.add(instance)`, followed by `db.commit()` and `db.refresh(instance)`
- **Updating**: Modify the instance and `db.commit()`
- **Deleting**: `db.delete(instance)` followed by `db.commit()`

## Module Data Models

### 1. User & Auth (`app/models/user.py`)
- **User**: Admin profiles and authentication data.

### 2. Members (`app/models/member.py`)
- **Member**: Manages customer contact records, phone numbers, and WhatsApp opt-in status.

### 3. Campaigns (`app/models/campaign.py`)
- **Campaign**: Manages bulk messaging campaigns and scheduling.
- **CampaignMember**: Association table tracking the delivery status (sent, delivered, read, failed) of a specific message to a specific member.

### 4. Templates & Media (`app/models/template.py`, `app/models/media.py`)
- **Template**: Approved WhatsApp template messages synced from Meta.
- **Media**: Uploaded media files mapped to Meta Media IDs for attaching to template messages.

## External APIs
- **Meta Graph API**: Interacted with via `app/services/meta_api.py` for dispatching messages, checking status, and managing media.
