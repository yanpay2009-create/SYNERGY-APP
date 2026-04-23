# Security Specification - Synergy Flow App

## 1. Data Invariants
- A User must have a unique `referralCode`.
- A User's `walletBalance` and `accumulatedIncome` must only be updated through controlled internal logic (or by admins).
- An Order must be linked to a valid `userId`.
- A CommissionTransaction must have a valid `userId` and `type`.
- `teamSize` must be updated atomically when a new member joins.
- Path variables (IDs) must be valid strings (size <= 128, alphanumeric + underscores/hyphens).

## 2. The "Dirty Dozen" Payloads (Exploit Attempts)

### Exploit 1: Identity Spoofing (Setting own role to admin)
**Target**: `CREATE /users/attacker_uid`
```json
{
  "name": "Attacker",
  "email": "attacker@spam.com",
  "role": "admin",
  "tier": "Executive"
}
```
**Expected**: `PERMISSION_DENIED` (Role must be 'user' unless created by existing admin).

### Exploit 2: Privilege Escalation (Changing own role via update)
**Target**: `UPDATE /users/victim_uid`
```json
{
  "role": "admin"
}
```
**Expected**: `PERMISSION_DENIED` (role is not in affectedKeys allowlist for non-admins).

### Exploit 3: PII Harvest (Reading another user's sensitive data)
**Target**: `GET /users/victim_uid`
**Actor**: Any authenticated user.
**Expected**: `PERMISSION_DENIED`.

### Exploit 4: Wallet Injection (Setting own balance)
**Target**: `UPDATE /users/attacker_uid`
```json
{
  "walletBalance": 999999
}
```
**Expected**: `PERMISSION_DENIED`.

### Exploit 5: ID Poisoning (Denial of Wallet via massive ID)
**Target**: `CREATE /users/[1KB_STRING_OF_JUNK]`
**Expected**: `PERMISSION_DENIED` (via `isValidId` check).

### Exploit 6: Orphaned Write (Creating order for non-existent user)
**Target**: `CREATE /orders/new_order`
```json
{
  "userId": "non_existent_uid",
  "status": "Pending"
}
```
**Expected**: `PERMISSION_DENIED`.

### Exploit 7: State Shortcutting (Setting order to 'Delivered' immediately)
**Target**: `CREATE /orders/new_order`
```json
{
  "status": "Delivered"
}
```
**Expected**: `PERMISSION_DENIED` (initial status must be 'Pending').

### Exploit 8: Shadow Update (Adding hidden fields to products)
**Target**: `UPDATE /products/prod_123`
```json
{
  "isVerified": true,
  "hiddenDiscount": 99
}
```
**Expected**: `PERMISSION_DENIED` (AffectedKeys violation).

### Exploit 9: Resource Exhaustion (Massive string in bio/caption)
**Target**: `CREATE /feed/new_post`
```json
{
  "caption": "[10MB_STRING]"
}
```
**Expected**: `PERMISSION_DENIED` (via `.size()` check).

### Exploit 10: Email Spoofing (Unverified email as admin)
**Actor**: User with `email` = "yanpay2009@gmail.com" but `email_verified` = `false`.
**Target**: `GET /systemSettings/current`
**Expected**: `PERMISSION_DENIED` (Must check `email_verified == true`).

### Exploit 11: Relational Sync Bypass (Updating teamSize without being upline)
**Target**: `UPDATE /users/victim_uid`
```json
{
  "teamSize": 0
}
```
**Expected**: `PERMISSION_DENIED`.

### Exploit 12: Anonymous Write (Writing without auth)
**Target**: `CREATE /feed/some_post`
**Actor**: Unauthenticated.
**Expected**: `PERMISSION_DENIED`.

## 3. Test Runner (Conceptual/Reference)
The following rules will be tested against these payloads.
