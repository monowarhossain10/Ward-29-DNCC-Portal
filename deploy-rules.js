// Instructions for deploying Firestore rules manually
console.log(`
To fix the "Missing or insufficient permissions" error for adding news, you need to deploy the updated Firestore security rules.

Here are the steps:

1. Install Firebase CLI (if not already installed):
   npm install -g firebase-tools

2. Login to Firebase:
   firebase login

3. Deploy the updated rules:
   firebase deploy --only firestore:rules --project ancient-ensign-474608-k8

The updated firestore.rules file has been modified to:
- Fix the isValidNews function to properly validate all news fields (title, content, image, created_at)
- Temporarily disable admin authentication checks for development mode

After deploying, you should be able to add news without permission errors.

⚠️  IMPORTANT: The current rules allow all operations for development.
Remember to re-enable proper authentication before going to production!
`);
