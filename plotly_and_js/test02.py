import plotly.graph_objects as go

# Create a map with layers
fig = go.Figure(go.Scattermapbox(
    lat=[40.7128, 34.0522],  # Coordinates for New York and LA
    lon=[-74.0060, -118.2437],
    mode='markers',
    marker=dict(size=14, color='red'),
    name="Cities"
))

# Define the layout with mapbox style
fig.update_layout(
    mapbox=dict(
        style="open-street-map",  # Use open street map
        center=dict(lat=39.8283, lon=-98.5795),  # Center of US
        zoom=3
    ),
    title="Interactive Map with Toggleable Layers"
)

# Save the figure to an HTML file to embed it into the final document
fig.write_html("plotly_map.html")
