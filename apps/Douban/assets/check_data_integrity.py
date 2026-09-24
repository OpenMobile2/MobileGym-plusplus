import json
d=json.load(open('/Users/user/mobgym_mock_app_project/mobilegym-mock/trial_apps/mobilegym/apps/Douban/data/defaults.json'))
ids=lambda arr:{x['id'] for x in arr}
U=ids(d['users']); SUBJ=ids(d['subjects']); G=ids(d['groups']); CEL=ids(d.get('celebrities',[]))
BC=ids(d['broadcasts']); GP=ids(d['groupPosts']); DISC=ids(d['discussions']); RV=ids(d['reviews'])
DL=ids(d.get('doulists',[])); TP=ids(d.get('topics',[]))
REPLY_IDS={x['id'] for x in d['replies']}
likes,reposts,collects,replies=d['likes'],d['reposts'],d['collects'],d['replies']
def cnt(arr,tt,tid): return sum(1 for x in arr if x.get('targetType')==tt and x.get('targetId')==tid)

print("=== A. COUNT>0 but ZERO records (empty-tab bug) ===")
bad=0
for arr,tt in ((d['broadcasts'],'broadcast'),(d['discussions'],'discussion'),(d['groupPosts'],'groupPost'),(d['reviews'],'review')):
  for e in arr:
    for cf,recs,lbl in (('likeCount',likes,'like'),('repostCount',reposts,'repost'),('collectCount',collects,'collect'),('replyCount',replies,'reply')):
      c=e.get(cf,0); r=cnt(recs,tt,e['id'])
      if c>0 and r==0:
        print("  %s %s: %s=%d but 0 %s records"%(tt,e['id'],cf,c,lbl)); bad+=1
print("  -> %d empty-tab mismatches"%bad)

print("=== B. DANGLING references ===")
dang=[]
for r in replies:
  if r.get('targetType')=='broadcast' and r['targetId'] not in BC: dang.append('reply->missing bc '+r['targetId'])
  if r.get('targetType')=='groupPost' and r['targetId'] not in GP: dang.append('reply->missing gp '+r['targetId'])
  if r.get('targetType')=='discussion' and r['targetId'] not in DISC: dang.append('reply->missing disc '+r['targetId'])
  if r.get('targetType')=='review' and r['targetId'] not in RV: dang.append('reply->missing rv '+r['targetId'])
  if r.get('quoteReplyId') and r['quoteReplyId'] not in REPLY_IDS: dang.append('reply.quote->missing '+str(r['quoteReplyId']))
for l in likes+reposts+collects:
  if l.get('userId') and l['userId'] not in U and l['userId']!='100200300': dang.append('like/rp/cl.userId missing '+l['userId'])
for m in d.get('marks',[]):
  if m['subjectId'] not in SUBJ: dang.append('mark->missing subject '+m['subjectId'])
for c in d.get('comments',[]):
  if c['subjectId'] not in SUBJ: dang.append('comment->missing subject '+c['subjectId'])
for b in d['broadcasts']:
  if b.get('subjectCard') and b['subjectCard'] not in SUBJ: dang.append('broadcast.subjectCard missing '+b['subjectCard'])
  if b.get('origId') and b['origId'] not in (BC|SUBJ|GP|DISC|RV): dang.append('broadcast.origId missing '+str(b['origId']))
for p in d['groupPosts']:
  if p['groupId'] not in G: dang.append('groupPost.groupId missing '+p['groupId'])
for s in d['subjects']:
  for cr in s.get('credits',[]):
    cid=cr.get('celebrityId')
    if cid and cid not in CEL: dang.append('subject %s credit->missing celeb %s'%(s['id'],cid))
for dl in d.get('doulists',[]):
  for it in dl.get('items',[]):
    rid=it.get('refId'); k=it.get('kind')
    if k=='subject' and rid not in SUBJ: dang.append('doulist %s item->missing subject %s'%(dl['id'],rid))
for uid in d.get('follows',{}).get('users',[]):
  if uid not in U and uid!='100200300': dang.append('follows.users->missing '+uid)
for gid in d.get('follows',{}).get('groups',[]) if isinstance(d.get('follows',{}).get('groups',[]),list) else []:
  if gid not in G: dang.append('follows.groups->missing '+gid)
for x in dang[:40]: print('  '+x)
print("  -> %d dangling refs"%len(dang))

print("=== C. count-field vs record-length (when count<=cap, should match) ===")
mism=0
for arr,tt in ((d['broadcasts'],'broadcast'),(d['discussions'],'discussion'),(d['groupPosts'],'groupPost'),(d['reviews'],'review')):
  for e in arr:
    rc=e.get('replyCount',0); actual=cnt(replies,tt,e['id'])
    # replies are fully seeded (not capped) so replyCount should ~ actual top-level+nested
    if rc>0 and actual==0: print("  %s %s replyCount=%d but 0 replies"%(tt,e['id'],rc)); mism+=1
print("  -> %d reply mismatches"%mism)

print("=== D. doulist doneCount vs items ===")
for dl in d.get('doulists',[]):
  its=[i for i in dl.get('items',[]) if i.get('kind')=='subject']
  dc=dl.get('doneCount',0)
  if dc>len(its): print("  doulist %s doneCount=%d > items=%d"%(dl['id'],dc,len(its)))
print("=== E. subjects rating vs ratingDist ===")
for s in d['subjects']:
  rd=s.get('ratingDist')
  if s.get('rating') is None and rd and sum(rd)>0: print("  subject %s rating=null but ratingDist has data"%s['id'])
