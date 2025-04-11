import pandas as pd
from bokeh.plotting import figure, output_file, save
from bokeh.models import ColumnDataSource, HoverTool, TapTool, CustomJS, Select
from bokeh.layouts import column
from bokeh.models.tiles import Vendors

# Convert lat/lon to Web Mercator
def latlon_to_mercator(lat, lon):
    import numpy as np
    k = 6378137
    x = lon * (k * np.pi / 180.0)
    y = np.log(np.tan((90 + lat) * np.pi / 360.0)) * k
    return x, y

# Load CSV data
df = pd.read_csv('data.csv')
df['x'], df['y'] = latlon_to_mercator(df['lat'], df['lon'])

# Create data sources
source = ColumnDataSource(df)
filtered_source = ColumnDataSource(data=source.data.copy())

# Create the plot
p = figure(x_axis_type="mercator", y_axis_type="mercator",
           tools="pan,wheel_zoom,reset,hover,tap",
           title="Geospatial Plot (Bokeh 3.5+)", height=600, width=800)

p.add_tile(Vendors.CARTODBPOSITRON)  # Use built-in tile vendor

# Use scatter instead of deprecated circle()
p.scatter('x', 'y', size=10, marker='circle', fill_color='blue', alpha=0.6, source=filtered_source)

# Hover tooltips
p.select_one(HoverTool).tooltips = [
    ("ID", "@id"),
    ("Category", "@category"),
    ("Value", "@value")
]

# Tap (click) popup
taptool = p.select_one(TapTool)
taptool.callback = CustomJS(args=dict(source=filtered_source), code="""
    const selected = source.selected.indices[0];
    if (selected != null) {
        const data = source.data;
        const msg = `ID: ${data['id'][selected]}\\nCategory: ${data['category'][selected]}\\nValue: ${data['value'][selected]}`;
        alert(msg);
    }
""")

# Filter dropdown
categories = ['All'] + sorted(df['category'].unique().tolist())
select = Select(title="Filter by Category", value="All", options=categories)

filter_callback = CustomJS(args=dict(source=source, target=filtered_source, select=select), code="""
    const data = source.data;
    const target_data = {x: [], y: [], id: [], lat: [], lon: [], category: [], value: []};
    const selected_cat = select.value;

    for (let i = 0; i < data['id'].length; i++) {
        if (selected_cat === 'All' || data['category'][i] === selected_cat) {
            for (let key in target_data) {
                target_data[key].push(data[key][i]);
            }
        }
    }
    target.data = target_data;
    target.change.emit();
""")

select.js_on_change("value", filter_callback)

# Output to HTML
output_file("geo_plot_bokeh35_fixed.html")
save(column(select, p))
