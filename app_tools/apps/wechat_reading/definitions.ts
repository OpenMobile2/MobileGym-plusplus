import { defineAppTools, ID, LIMIT, STRING } from '../../core/define';
export const WECHAT_READING_TOOL_DEFINITIONS = defineAppTools('wechat_reading', [
  { name:'search_books', description:'Search the WeChat Reading catalog by title, author, or category.', properties:{query:STRING,limit:LIMIT}, required:['query'] },
  { name:'get_book_summary', description:'Return catalog metadata and current reading progress for one book.', properties:{book_id:ID}, required:['book_id'] },
  { name:'get_hot_search', description:'Return the public hot-search chart.', properties:{limit:LIMIT} },
  { name:'list_bookshelf', description:'List books on the current shelf with privacy and progress summaries.', properties:{limit:LIMIT} },
  { name:'get_reading_stats', description:'Aggregate reading minutes over an optional local-date range.', properties:{date_from:STRING,date_to:STRING} },
  { name:'compare_books', description:'Compare word count, rating, and recommendation values for selected books.', properties:{book_ids:{type:'array',items:ID,minItems:2,maxItems:10}}, required:['book_ids'] },
  { name:'open_search', description:'Open WeChat Reading search.', kind:'navigation' },
  { name:'open_book', description:'Open a book detail page.', properties:{book_id:ID}, required:['book_id'], kind:'navigation' },
  { name:'open_reader', description:'Open the normal reader at the persisted position.', properties:{book_id:ID}, required:['book_id'], kind:'navigation' },
  { name:'open_bookshelf', description:'Open the normal WeChat Reading bookshelf for continued GUI operations.', kind:'navigation' },
  { name:'add_to_bookshelf', description:'Add one catalog book to the shelf without changing reading progress.', properties:{book_id:ID}, required:['book_id'], kind:'write', idempotent:true },
]);
