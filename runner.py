# !pip install xgboost
# !pip install --upgrade google-cloud-bigquery
# ! pip install --upgrade google-cloud-bigquery[pandas]


from flask import Flask, render_template, request
from flask_cors import CORS, cross_origin

import json
import random
import os
import sys
import pandas as pd
import pickle
import time

# tools required libs
# import redis
import pandas_gbq

#  custom libs
from libs.My_Logger import My_Logger
from libs.My_Redis import My_Redis as REDIS_CLIENT
# import logging as log

REDIS_CLIENT = REDIS_CLIENT()


sys.path.append(os.path.join(os.path.dirname(__file__)))

app = Flask(__name__, static_url_path='/static')
CORS(app, support_credentials=True)

MODEL_BUILDER_PATH = "model_builder/"

MODEL_STORE = MODEL_BUILDER_PATH + "model_store/"
DATA_STORE = MODEL_BUILDER_PATH + "data_store/"
HISTORICAL_DATA_STORE = MODEL_BUILDER_PATH + "historical_data_store/"
SENSITIVE_STORE = MODEL_BUILDER_PATH + "sensitive_store/"
PLANNING_WEEK = "2018-07-09"

ACCOUNTS_LIST = ["THD"]
BU_LIST = ["REF"]
DC_LIST = ['N1A', 'N1C', 'N1D', 'N1F', 'N1G', 'N1Z', 'NTX']
PRODUCTS_LIST = ['LFC24770SB', 'LBN10551PS', 'LFXS28596S', 'LDC24370SW', 'LFXS28566D', 'LFXS32726S', 'LTCS20220S', 'LSXS26326W', 'LFCS25426S', 'LSXS26396S', 'LBNC10551V', 'LFXS30726M', 'LFXS24623S', 'LSC27925ST', 'LSFXC2476S', 'LMXS28626S', 'LMXS28626D', 'LMNS14420V', 'LMXS30756S', 'LBN10551SW', 'LFX25973ST', 'LFC22770SB', 'LMXS28596D', 'LBC24360SW', 'LFCS22520S', 'LFXS29766S', 'LSXS26336S', 'LFXS26596D', 'LNXS30866D', 'LFXS30726S', 'LSXC22396D', 'LRFDS3006S', 'LFXS24623D', 'LMXC23796M', 'LTCS24223S', 'LFX25974SB', 'LFCS22520W', 'LMXS28596S', 'LFCS25426D', 'LMXS30746S', 'LFXS30766S', 'LFXS32766S', 'LFX28968D', 'LFXS26596S', 'LSXS22423W', 'LSXS26366D', 'LFC24770SW', 'LFXC24726D', 'LFXC22526D', 'LFXS29626S', 'LFXC24726M', 'LFXC24796S', 'LFXS26973D', 'LNXC23726S', 'LNXC23766D', 'LBC24360ST', 'LFX28968SB', 'LFX28968SW', 'LFXS27566S', 'LFXS28566S', 'LMXC23746S', 'LTCS24223B', 'LFXS28596D', 'LFCS31626S', 'LFXS28968S', 'LFC20770ST', 'LFXC24726S', 'LFXC24796D', 'LMXS30776S', 'LMXS27626D', 'LFDS22520S', 'LFC22770SW', 'LFX25974SW', 'LFXC22526S', 'LPCS34886C', 'LFXS28596M', 'LSC22991ST', 'LMXC23746D', 'LSXC22326S', 'LMXS30796D', 'LSXS22423B', 'LBN10551PV', 'LSXC22426S', 'LSXS26336D', 'LDCS24223S', 'LFXS24663S', 'LSXC22396S', 'LTCS20220W', 'LSFXC2496S', 'LFX25974ST', 'LTCS20120S', 'LDCS24223W', 'LSXC22486D', 'LMXS30796S', 'LSXS26466S', 'LFC22770ST', 'LFXC22596S', 'LFXS24623B', 'LFXS30796S', 'LFC28768SW', 'LFXS26596M', 'LSSB2696BD', 'LSXS26326B', 'LDC24370ST', 'LSXS22423S', 'LFXS30766D', 'LRFXC2406S', 'LSXC22386S', 'LFXS24623W', 'LMXS30776D', 'LSXS26386S', 'LTCS24223W', 'LFXS28968D', 'LRFXC2406D', 'LFC28768ST', 'LSXC22386D', 'LTCS20220B', 'LTCS24223D', 'LFC21776ST', 'LRFDS3006D', 'LDCS24223B', 'LFX25973D', 'LSFD2491ST', 'LFXS29626W', 'LFXS28566M', 'LSFXC2496D', 'LSXS26386D', 'LTWS24223S', 'LFCS22520D', 'LFC28768SB', 'LFXS24566S', 'LMXC23796S', 'LKIM08121V', 'LFCC22426S', 'LFXS24626D', 'LFXS27466S', 'LMXS27626S', 'LMXS27676D', 'LFXS30796D', 'LFCS22520B', 'LFX28968ST', 'LMXC23796D', 'LSXS26366S', 'LFC24770ST', 'LBNC15221V', 'LSXS26326S', 'LPXS30866D', 'LSXC22486S', 'LDCS22220S', 'LFXC22596D', 'LFXS29626B', 'LFC21776D', 'LFX21976ST', 'LSFXC2476D', 'LFXS26973S', 'LSSB2692ST']
SMSB_SUBCATEGORY = ['TOP_BOTTOM FREEZER','FRENCH DOOR','KIMCHI','SIDE X SIDE']
DROPIN_LIST = ['LFCS22520S','LFCS22520D','LFCS25426S','LFXS26973D']

log = My_Logger.get_logger()

@app.route('/')
@cross_origin(supports_credentials=True)
def welcome():
    log.info("Rendering the frontend")
    return render_template("index.html")

# ------------------------------------------------------------------------------------------------------

@app.route('/accounts', methods= ["GET"])
@cross_origin(supports_credentials=True)
def get_accounts():
    res = dict()
    data = ACCOUNTS_LIST
    try:
        res['status'] = 200
        res['msg'] = data
    except Exception as e:
        res['status'] = 400
        res['msg'] = "Unable to fetch accounts"
        log.error(e)
    finally:
        return json.dumps(res)


# ------------------------------------------------------------------------------------------------------

@app.route('/bu', methods= ["GET"])
@cross_origin(supports_credentials=True)
def get_bu():
    res = dict()
    data =  BU_LIST
    try:
        res['status'] = 200
        res['msg'] = data
    except Exception as e:
        res['status'] = 400
        res['msg'] = "Unable to fetch accounts"
        log.error(e)
    finally:
        return json.dumps(res)

# ------------------------------------------------------------------------------------------------------

@app.route('/smsb', methods= ["GET"])
@cross_origin(supports_credentials=True)
def get_smsb():
    res = dict()
    data = SMSB_SUBCATEGORY
    try:
        res['status'] = 200
        res['msg'] = data
    except Exception as e:
        res['status'] = 400
        res['msg'] = "Unable to fetch accounts"
        log.error(e)
    finally:
        return json.dumps(res)

# ------------------------------------------------------------------------------------------------------


@app.route('/products', methods= ["GET"])
@cross_origin(supports_credentials=True)
def get_products():
    res = dict()
    data =  PRODUCTS_LIST
    try:
        res['status'] = 200
        res['msg'] = data
    except Exception as e:
        res['status'] = 400
        res['msg'] = "Unable to fetch accounts"
        log.error(e)
    finally:
        return json.dumps(res)

# ------------------------------------------------------------------------------------------------------

@app.route('/dc', methods= ["GET"])
@cross_origin(supports_credentials=True)
def get_dc():
    res = dict()
    data =  DC_LIST
    try:
        res['status'] = 200
        res['msg'] = data
    except Exception as e:
        res['status'] = 400
        res['msg'] = "Unable to fetch accounts"
        log.error(e)
    finally:
        return json.dumps(res)


# ------------------------------------------------------------------------------------------------------

@app.route('/data', methods= ["GET"])
@cross_origin(supports_credentials=True)
def get_actual_data():
    req = {}
    try:
        req["account"] = request.args["account"]
        req["bu"] = request.args["bu"]
        req["product"] = request.args["product"]
        req["smsb"] = request.args["smsb"]
        req["dc"] = request.args["dc"]
    except Exception as e:
        res = {
            "status": 400,
            "msg":"Incomplete data! Provide valid account, BU, product and DC."
        }
        log.error(e)
        return json.dumps(res)

    _planning_week = PLANNING_WEEK
    if req["product"] in DROPIN_LIST:
        _planning_week = "2018-09-24"
    
    _cat = "pred_data"
    _cat = "X_test"
    _key = "_".join([req["account"], req["bu"], req["smsb"] ,req["dc"], req["product"], _planning_week])
    _data = REDIS_CLIENT.get_col(_cat, _key)
    if(_data):
        # log.info(_data)
        log.info("Cache hit for key:{} on col: {}".format(_key, _cat))
        res = {
            "status" : 200,
            "msg":_data
        }
        return json.dumps(res)        
    log.info("Cache miss for key:{} on col: {}".format(_key, _cat))
    filename = "_".join([_cat, _key])+".json"
    filename = DATA_STORE + filename
    try:
        with open(filename, 'r') as f:
            sim_inputs = f.read()
    except Exception as e:
        res = {
            "status": 400,
            "msg":"Cannot locate data for account:{}, bu:{}, smsb : {} product:{} and dc:{}".format(req["account"], req["bu"], req["smsb"], req["product"], req["dc"])
        }
        print("Cannot locate data file {}".format(filename))
        log.error(e)
        return json.dumps(res)
    res = {
        "status" : 200,
        "msg":sim_inputs
    }
    REDIS_CLIENT.set_col(_cat, _key, sim_inputs)
    return json.dumps(res)

# ------------------------------------------------------------------------------------------------------

@app.route('/data', methods= ["POST"])
@cross_origin(supports_credentials=True)
def get_simulated_data():
    req = {}
    res = {}
    try:
        req["data"] = request.form["data"]
        req["dc"] = request.form["dc"]
        req["product"] = request.form["product"]
        req["account"]=request.form["account"]
        req["bu"] = request.form["bu"]
        req["smsb"] = request.form["smsb"]
        req["data"] = json.loads(request.form["data"])
    except Exception as e:
        res["status"] = 400
        res["msg"] = "No enough arguments provided to fetch the data"
        log.error(e)
        return json.dumps(res)
    df_sim_inputs = None
    try:
        df_sim_inputs = pd.DataFrame(req["data"]).T
    except Exception as e:
        res = {
            "status":400,
            "msg":"Illegal data requested! Cannot create dataframe"
        }
        log.error(e)
        return json.dumps(res)
#     print(df_sim_inputs)
    df_sim_inputs['discount'] = df_sim_inputs['MAP']-df_sim_inputs['PMAP']
    df_sim_inputs['discount_percentage'] = df_sim_inputs['discount']/df_sim_inputs['MAP']
#     print(df_sim_inputs)
    _planning_week = PLANNING_WEEK
    if req["product"] in DROPIN_LIST:
        _planning_week = "2018-09-24"
        

    filename = "_".join(["X_test", req["account"], req["bu"],req["smsb"], req["dc"], req["product"], _planning_week])
    try:
        with open(DATA_STORE + filename + ".json", 'r') as f:
                sim_inputs = json.loads(f.read())
    except Exception as e:
        res = {
            "status":400,
            "msg":"Cannot locate data for account:{}, bu:{}, product:{} and dc:{}".format(req["account"], req["bu"], req["product"], req["dc"])
        }
        log.error(e)
        log.error("Cannot locate data file {}".format(DATA_STORE + filename + ".json"))
        return json.dumps(res)
    dummy = pd.DataFrame(sim_inputs).T
    
    df_sim_inputs['event_flag'] = dummy['event_flag']
    df_sim_inputs['event_groups_Low'] = dummy['event_groups_Low']
    df_sim_inputs['event_groups_Mid'] = dummy['event_groups_Mid']
    df_sim_inputs['event_groups_Not Applicable'] = dummy['event_groups_Not Applicable']

    filename = "_".join(["model", req["account"], req["bu"], req["smsb"], req["dc"], req["product"], _planning_week])
    # print(filename)
    try:
        with open(MODEL_STORE + filename + ".sav", 'rb') as f:
                model1_p1 = pickle.load(f)
    except Exception as e:
        res = {
            "status":400,
            "msg":"Cannot locate model for account:{}, bu:{}, product:{} and dc:{}".format(req["account"], req["bu"], req["product"], req["dc"])
        }
        log.error("Cannot locate model file {}".format(MODEL_STORE + filename + ".sav"))
        log.error(e)
        return json.dumps(res)
#     print("model file: " + filename + " loaded")
    
    model_features = model1_p1.get_booster().feature_names
    #df_Xtest_for_simulation = df_sim_inputs[['discount', 'discount_percentage', 'FLOORING', 'event_flag', 'event_groups_Low', 'event_groups_Mid', 'event_groups_Not Applicable']]
    df_Xtest_for_simulation = df_sim_inputs[model_features] 
    df_Xtest_for_simulation['discount'] = df_Xtest_for_simulation['discount'].astype('float64')
    df_Xtest_for_simulation['discount_percentage'] = df_Xtest_for_simulation['discount_percentage'].astype('float64')
    df_Xtest_for_simulation['event_flag'] = df_Xtest_for_simulation['event_flag'].astype('int64')
    df_Xtest_for_simulation['FLOORING'] = df_Xtest_for_simulation['FLOORING'].astype('int64')
    df_Xtest_for_simulation['event_groups_Low'] = df_Xtest_for_simulation['event_groups_Low'].astype('uint8')
    df_Xtest_for_simulation['event_groups_Mid'] = df_Xtest_for_simulation['event_groups_Mid'].astype('uint8')
    df_Xtest_for_simulation['event_groups_Not Applicable'] = df_Xtest_for_simulation['event_groups_Not Applicable'].astype('uint8')
    if req["product"] in DROPIN_LIST:
        df_Xtest_for_simulation['TARGET_QTY'] = df_Xtest_for_simulation['TARGET_QTY'].astype('int64')
        df_Xtest_for_simulation['drop_in_week'] = df_Xtest_for_simulation['drop_in_week'].astype('int64')
    y_pred=model1_p1.predict(df_Xtest_for_simulation)
    week_keys = df_Xtest_for_simulation.index
    res = json.dumps(dict(zip(week_keys, y_pred.round().tolist())))
#     print(res)
    respon = {
        "status":200,
        "msg":res
    }
    return json.dumps(respon)

@app.route('/historical_data', methods= ["GET"])
@cross_origin(supports_credentials=True)
def get_historicalData_data():
    req = {}
    try:
        req["account"] = request.args["account"]
        req["bu"] = request.args["bu"]
        req["product"] = request.args["product"]
        req["smsb"] = request.args["smsb"]
        req["dc"] = request.args["dc"]
    except Exception as e:
        res = {
            "status": 400,
            "msg":"Incomplete data! Provide valid account, BU, product and DC."
        }
        log.error(e)
        return json.dumps(res)
    _planning_week = PLANNING_WEEK
    if req["product"] in DROPIN_LIST:
        _planning_week = "2018-09-24"

    _cat = "Last_year"
    _key = "_".join([req["account"], req["bu"], req["smsb"] ,req["dc"], req["product"], _planning_week])
    _data = REDIS_CLIENT.get_col(_cat, _key)
    if(_data):
        log.info("Cache hit for key:{} on col: {}".format(_key, _cat))
        res = {
            "status" : 200,
            "msg":_data
        }
        return json.dumps(res)        
    log.info("Cache miss for key:{} on col: {}".format(_key, _cat))
    filename = "_".join([_cat, _key])+".json"
    filename = HISTORICAL_DATA_STORE + filename

    try:
        with open(filename, 'r') as f:
            sim_inputs = f.read()
    except Exception as e:
        res = {
            "status": 400,
            "msg":"Cannot locate data for account:{}, bu:{}, smsb : {} product:{} and dc:{}".format(req["account"], req["bu"], req["smsb"], req["product"], req["dc"])
        }
        log.error(e)
        return json.dumps(res)
    res = {
        "status" : 200,
        "msg":sim_inputs
    }
    REDIS_CLIENT.set_col(_cat, _key, sim_inputs)
    return json.dumps(res)


@app.route('/sensitivity_data', methods= ["GET"])
@cross_origin(supports_credentials=True)
def sensitivity_data():
    req = {}
    try:
        req["account"] = request.args["account"]
        req["product"] = request.args["product"]
        req["dc"] = request.args["dc"]
        req["target_week"] = request.args["target_week"]
        req["driver_name"] = request.args["driver_name"]
    except Exception as e:
        res = {
            "status": 400,
            "msg":"Incomplete data! Provide valid account, BU, product and DC."
        }
        log.error(e)
        return json.dumps(res)

    _planning_week = PLANNING_WEEK
    if req["product"] in DROPIN_LIST:
        _planning_week = "2018-09-24"
    
    
    _cat = "Sensitivity"
    _key = "_".join([ req["account"], req["dc"], req["product"], _planning_week, req["target_week"], req["driver_name"] ])
    _data = REDIS_CLIENT.get_col(_cat, _key)
    if(_data):
        log.info("Cache hit for key:{} on col: {}".format(_key, _cat))
        res = {
            "status" : 200,
            "msg":json.loads(_data)
        }
        return json.dumps(res)        
    log.info("Cache miss for key:{} on col: {}".format(_key, _cat))
    bq_res = []
    try:
        query = '''SELECT driver_value as value, forecast as sales 
                    FROM `demand-forecasting-bh.test.driver_sensitivity` where 
                    account = '{}' 
                    AND dc = '{}'
                    AND model = '{}' 
                    AND planning_week = '{}' 
                    AND target_week = '{}'
                    AND driver_name = '{}'
                    order by percentile
                    '''.format(req["account"], req["dc"], req["product"], _planning_week, req["target_week"] , req["driver_name"] )
#         print(query)
        bq_res_df = pd.read_gbq(query,project_id='demand-forecasting-bh',dialect='standard')
#         print(bq_res_df)
        bq_res = list(bq_res_df.T.to_dict().values())
#         print(bq_res)
    except Exception as e:
        res = {
            "status": 400,
            "msg":"Cannot locate sensitivity data" # for account:{}, planning_week : {}, target_week:{}, product:{} and dc:{}".format(req["account"], req["bu"], _planning_week, req["target_week"], req["product"], req["dc"])
        }
        log.error("Cannot locate sensitivity data")
        log.error(e)
        return json.dumps(res)
    res = {
        "status" : 200,
        "msg":bq_res
    }
    REDIS_CLIENT.set_col(_cat, _key, json.dumps(bq_res))
    return json.dumps(res)


if __name__ == '__main__':
    app.run(host="0.0.0.0", port=4444, debug = True)
