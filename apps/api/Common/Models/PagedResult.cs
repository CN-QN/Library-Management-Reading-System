namespace api.Common.Models;

public class PagedResult<T>
{
    public IEnumerable<T> Items { get; set; } = Enumerable.Empty<T>();
    public int Page { get; set; }
    public int Limit { get; set; }
    public long TotalItems { get; set; }
    public int TotalPages => (int)Math.Ceiling((double)TotalItems / Limit);
    public bool HasNext => Page < TotalPages;

    public PagedResult(IEnumerable<T> items, int page, int limit, long totalItems)
    {
        Items = items;
        Page = page;
        Limit = limit;
        TotalItems = totalItems;
    }
}
