local name, id, time = unpack(ARGV);

local claimed = redis.call('zadd', 'job.claimed:'..name, time, id);
if claimed ~= 1 then
    return {'Could not claim job'};
end

local item = redis.call('hget', 'job.items:'..name, id);

return {false, item, id}
