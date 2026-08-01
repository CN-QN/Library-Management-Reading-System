using api.Database;
using StackExchange.Redis;

namespace api.Common.Redis
{
    public class RedisLockHelper
    {
        private readonly RedisContext _redisContext;
        private readonly ILogger<RedisLockHelper> _logger;

        public RedisLockHelper(RedisContext redisContext, ILogger<RedisLockHelper> logger)
        {
            _redisContext = redisContext;
            _logger = logger;
        }

        public async Task<bool> AcquireLockAsync(string lockKey, string lockValue, TimeSpan expiry)
        {
            try
            {
                var db = _redisContext.GetDatabase();
                return await db.StringSetAsync(lockKey, lockValue, expiry, When.NotExists);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to acquire Redis lock for key: {LockKey}", lockKey);
                return false;
            }
        }

        public async Task<bool> ReleaseLockAsync(string lockKey, string lockValue)
        {
            try
            {
                var db = _redisContext.GetDatabase();
                // Lua script to safely release lock only if lockValue matches
                var luaScript = @"
                    if redis.call('get', KEYS[1]) == ARGV[1] then
                        return redis.call('del', KEYS[1])
                    else
                        return 0
                    end";

                var result = await db.ScriptEvaluateAsync(luaScript, new RedisKey[] { lockKey }, new RedisValue[] { lockValue });
                return (long)result == 1;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to release Redis lock for key: {LockKey}", lockKey);
                return false;
            }
        }
    }
}
