# Security Specification for Ward 29 DNCC Portal

## 1. Data Invariants
- A `voter` record must have a valid NID and DOB.
- A `complaint` must have a `tracking_id` and contact information.
- Only admins can modify `news`, `events`, `gallery`, and `councilor` info.
- Users can create `volunteers` and `complaints` but not modify them once submitted (except status by admin).
- Volunteers can only see their own status (if we add personal access, but currently it's for admin view).
- Public can read `news`, `events`, `gallery`, `councilor`, and `council_members`.

## 2. The "Dirty Dozen" Payloads (Denial Tests)
1. **Unauthorized News Creation**: Attempt to create a news item without admin auth.
2. **Identity Spoofing in Complaint**: Attempt to submit a complaint with a fake UID (if we used UID, but it's tracking ID based).
3. **Ghost Field in Volunteer**: Attempt to add `isApproved: true` in the initial volunteer submission.
4. **Councilor Profile Hijack**: Attempt to update `/settings/councilor` as a regular user.
5. **Voter Data Scrape**: Attempt to list all voters without admin privileges.
6. **Malicious ID in Voter**: Attempt to create a voter with a 2KB string as ID.
7. **Negative Serial Number**: Attempt to set `serial_no` to a negative value or invalid type.
8. **Bypassing Mandatory Fields**: Submit a complaint without a message.
9. **Admin Role Self-Assignment**: A user trying to create an entry in `/admins/` for themselves.
10. **State Skipping in Complaint**: Setting status to "Resolved" directly upon creation.
11. **Massive Payload**: Attempt to send a 2MB string in the `message` field.
12. **Unauthorized Deletion**: Regular user trying to delete a news item.

## 3. Test Runner (Draft)
The `firestore.rules.test.ts` will verify these DENY conditions.
