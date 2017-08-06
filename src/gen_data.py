# -*- coding: utf-8 -*-
"""
Created on Sun Aug 06 11:40:14 2017

@author: Zeyi
"""

import datetime as dt

import numpy as np
import pandas as pd

from haikunator import Haikunator #Haikunate names generator

def generate_names(num_names=10):
    haikunator = Haikunator()
    names = [haikunator.haikunate(token_length=0) for i in range(num_names)]
    return names
    
if __name__ == "__main__":
    
    timenow = dt.datetime.now()
    
    timesteps = 5000 #Number of events to generate
    num_nodes = 50 #Number of possible nodes existing on the graph
    
    #Generate node names
    names = generate_names(num_nodes)
    
    #Generate some events with poisson arrival rate
    df = pd.DataFrame();
    
    sim_t = timenow
    for i in range(timesteps):
        #Pick random 2 nodes
        pick_two = np.random.choice(num_nodes, size=2, replace=False)
        
        #Generate random score
        score = np.random.lognormal()
        
        #Advance by random timestep
        sim_t += dt.timedelta(microseconds= np.random.exponential(scale=10.0,)*1e3)
        
        #Append to dataframe
        tmp_df = pd.DataFrame({'source':[names[pick_two[0]]],
                               'target':[names[pick_two[1]]],
                               'value':[score],
                               'datetime':[sim_t]})
        df = pd.concat([df, tmp_df], ignore_index=True)
        
    df.to_csv('graph_data.csv', index=False)