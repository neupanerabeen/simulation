import redis
from libs.My_Logger import My_Logger

log = My_Logger.get_logger()

class My_Redis:
	def __init__(self, host = "localhost", port = 6379):
		self.redis = redis.Redis(host = host, port = port)
		
	def set_val(self, key = "", val = ""):
		if(key != ""):
			self.redis.set(key, val)

	def get_val(self, key = ""):
		res = self.redis.get(key)
		if(res == None):
			return False
		return red.decode()
		
	def set_col(self, my_col = "", _key = "", _val = ""):
		if(my_col == "" or _key == "" ):
			return False
		try:
			if(self.redis.hset(my_col, _key, _val) == None):
				return False
			return True
		except Exception as e:
			log.warning(e)
			return False

	def get_col(self, my_col = "", _key = ""):
		try:
			if(my_col == "" or _key == ""):
				return False
			res = self.redis.hget(my_col, _key)
			if(res == None):
				return False
			return res.decode()
		except Exception as e:
			log.warning(e)
			return False