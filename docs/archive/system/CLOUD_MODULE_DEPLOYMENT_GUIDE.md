# Cloud Module Deployment Guide

## Quick Deployment Steps

### 1. Deploy Firestore Rules and Indexes
```bash
firebase deploy --only firestore:rules,firestore:indexes
```

### 2. Deploy Firebase Storage Rules
```bash
firebase deploy --only storage
```

### 3. Build and Deploy Application
```bash
yarn build
firebase deploy --only hosting
```

### 4. Verify Deployment
- Check Firestore Console: Indexes should be "Enabled" (green)
- Check Storage Console: Rules should be deployed
- Test file upload/download in application

## Testing Checklist

- [ ] Upload a test file (image or PDF)
- [ ] Verify file appears in file list
- [ ] Download uploaded file
- [ ] Delete test file
- [ ] Create backup
- [ ] Verify backup appears in backup list
- [ ] Check storage statistics update correctly

## Troubleshooting

### Files not appearing after upload
1. Check Firestore indexes: `firebase firestore:indexes`
2. Wait for indexes to build (5-15 minutes if "Building")
3. Re-deploy if needed: `firebase deploy --only firestore:indexes`

### Upload fails with "Permission Denied"
1. Verify user is authenticated
2. Check Storage rules are deployed: `firebase deploy --only storage`
3. Verify file size < 100MB
4. Check file type is allowed in `storage.rules`

### Download not working
1. Check file exists in Firebase Storage console
2. Verify download URL is generated
3. Check CORS configuration if needed

---

**Last Updated**: 2025-12-14  
**Status**: Production Ready ✅
