namespace api.Common.Constants;

public static class StatusValues
{
    public static class User
    {
        public const string PENDING = "PENDING";
        public const string ACTIVE = "ACTIVE";
        public const string LOCKED = "LOCKED";
        public const string SUSPENDED = "SUSPENDED";
        public const string DELETED = "DELETED";
    }

    public static class Book
    {
        public const string DRAFT = "DRAFT";
        public const string REVIEW = "REVIEW";
        public const string PUBLISHED = "PUBLISHED";
        public const string ARCHIVED = "ARCHIVED";
    }

    public static class Chapter
    {
        public const string DRAFT = "DRAFT";
        public const string PUBLISHED = "PUBLISHED";
        public const string HIDDEN = "HIDDEN";
    }

    public static class BookCopy
    {
        public const string AVAILABLE = "AVAILABLE";
        public const string BORROWED = "BORROWED";
        public const string RESERVED = "RESERVED";
        public const string LOST = "LOST";
        public const string DAMAGED = "DAMAGED";
        public const string MAINTENANCE = "MAINTENANCE";
    }

    public static class Borrowing
    {
        public const string OPEN = "OPEN";
        public const string PARTIALLY_RETURNED = "PARTIALLY_RETURNED";
        public const string RETURNED = "RETURNED";
        public const string OVERDUE = "OVERDUE";
        public const string CANCELLED = "CANCELLED";
    }

    public static class Reservation
    {
        public const string WAITING = "WAITING";
        public const string READY = "READY";
        public const string FULFILLED = "FULFILLED";
        public const string CANCELLED = "CANCELLED";
        public const string EXPIRED = "EXPIRED";
    }

    public static class Fine
    {
        public const string UNPAID = "UNPAID";
        public const string PAID = "PAID";
        public const string WAIVED = "WAIVED";
        public const string CANCELLED = "CANCELLED";
    }

    public static class Review
    {
        public const string PENDING = "PENDING";
        public const string VISIBLE = "VISIBLE";
        public const string HIDDEN = "HIDDEN";
        public const string REJECTED = "REJECTED";
    }
}
