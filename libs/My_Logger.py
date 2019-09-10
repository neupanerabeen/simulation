import logging as log

class My_Logger():
	def __init__(self):
		pass

	def get_logger(_level = log.INFO):
		log.basicConfig(
			format='%(asctime)s - %(message)s', 
			level=_level,
			filename="applog.log",
		)
		return log


