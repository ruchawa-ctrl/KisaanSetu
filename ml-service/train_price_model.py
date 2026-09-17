"""Train a 10-day mandi modal-price forecaster from Agmarknet-like CSV or synthetic data."""
from pathlib import Path
import joblib, numpy as np, pandas as pd
from sklearn.metrics import mean_absolute_percentage_error
from xgboost import XGBRegressor

FEATURES = ['arrival_tonnes', 'lag_1', 'lag_7', 'rolling_7', 'day_of_year_sin', 'day_of_year_cos']
def make_data(csv_path=None):
    if csv_path: return pd.read_csv(csv_path, parse_dates=['date'])
    rng = np.random.default_rng(7); dates = pd.date_range('2022-01-01', periods=800); rows=[]
    for mandi_id, commodity, base in [('NASHIK','Onion',2300),('PUNE','Onion',2200),('LATUR','Soybean',4600)]:
        for day, current in enumerate(dates): rows.append({'date':current,'mandi_id':mandi_id,'commodity':commodity,'arrival_tonnes':max(40, 150 + rng.normal(0,20)),'modal_price':base + 250*np.sin(day/28) + day*.35 + rng.normal(0,70)})
    return pd.DataFrame(rows)
def engineer(df):
    df = df.sort_values(['mandi_id','commodity','date']).copy(); group = df.groupby(['mandi_id','commodity'])['modal_price']; df['lag_1']=group.shift(1); df['lag_7']=group.shift(7); df['rolling_7']=group.transform(lambda values: values.shift(1).rolling(7).mean()); df['day_of_year_sin']=np.sin(2*np.pi*df.date.dt.dayofyear/365); df['day_of_year_cos']=np.cos(2*np.pi*df.date.dt.dayofyear/365); df['target']=group.shift(-10); return df.dropna()
def get_sale_recommendation(current_price, days_to_hold, storage_cost_per_day):
    expected_price = current_price * (1 + 0.006 * days_to_hold); gain = expected_price - current_price - storage_cost_per_day * days_to_hold; return {'expected_price': expected_price, 'net_gain_per_kg': gain, 'recommendation': 'HOLD' if gain > 0 else 'SELL'}
def train(csv_path=None, output='price_forecaster.joblib'):
    data = engineer(make_data(csv_path)); split = int(len(data)*.8); model = XGBRegressor(n_estimators=250, max_depth=5, learning_rate=.05, objective='reg:squarederror', random_state=7); model.fit(data[FEATURES].iloc[:split], data.target.iloc[:split]); predictions = model.predict(data[FEATURES].iloc[split:]); print(f'MAPE: {mean_absolute_percentage_error(data.target.iloc[split:], predictions):.3f}'); joblib.dump({'model':model,'features':FEATURES}, output)
if __name__ == '__main__': train()
