import json, uuid, sys
U = lambda: str(uuid.uuid4())
items = {}   # name -> (icon, tile)
def node(name, icon, x, y): items[name] = (icon, (x, y))
# Public zone (front-right), Service mesh (middle), Data layer (back-left)
node('Client',               'laptop',      7,  0)
node('API Gateway',          'router',      5,  1)
node('Auth Service',         'lock',        5,  3)
node('Order Service',        'server',      3,  3)
node('Payment Service',      'paymentcard', 3,  5)
node('Event Queue',          'queue',       1,  4)
node('Notification Service', 'mail',        0,  6)
node('Order DB',             'storage',    -2,  3)
node('Payment DB',           'storage',    -2,  5)
ids = {n: U() for n in items}
model_items = [{'id': ids[n], 'name': n, 'icon': ic} for n,(ic,_) in items.items()]
view_items  = [{'id': ids[n], 'tile': {'x': t[0], 'y': t[1]}, 'labelHeight': 80} for n,(_,t) in items.items()]
def conn(a, b, label=None, color='blue', style='SOLID', pos=50, height=0):
    c = {'id': U(), 'color': color, 'style': style, 'width': 12,
         'anchors': [{'id': U(), 'ref': {'item': ids[a]}}, {'id': U(), 'ref': {'item': ids[b]}}]}
    if label: c['labels'] = [{'id': U(), 'text': label, 'position': pos, 'height': height}]
    return c
connectors = [
    conn('Client', 'API Gateway', 'GET / POST'),
    conn('API Gateway', 'Auth Service', 'Token check', style='DOTTED', pos=72, height=30),
    conn('API Gateway', 'Order Service', 'POST /orders', pos=40, height=40),
    conn('API Gateway', 'Payment Service', 'POST /payments', pos=25),
    conn('Order Service', 'Event Queue', 'OrderCreated', style='DASHED', pos=50, height=-40),
    conn('Payment Service', 'Event Queue', 'PaymentCompleted', style='DASHED'),
    conn('Event Queue', 'Notification Service'),
    conn('Order Service', 'Order DB'),
    conn('Payment Service', 'Payment DB'),
]
rects = [
    {'id': U(), 'color': 'zone-red',   'from': {'x': 8, 'y': -1}, 'to': {'x': 4, 'y':  2}},
    {'id': U(), 'color': 'zone-blue',  'from': {'x': 6, 'y':  3}, 'to': {'x': 0, 'y':  7}},
    {'id': U(), 'color': 'zone-green', 'from': {'x': -1, 'y': 2}, 'to': {'x': -3, 'y': 6}},
]
texts = [
    {'id': U(), 'tile': {'x': 8, 'y': -1}, 'content': 'Public Zone',  'fontSize': 0.45, 'orientation': 'X'},
    {'id': U(), 'tile': {'x': 6, 'y':  7}, 'content': 'Service Mesh', 'fontSize': 0.45, 'orientation': 'X'},
    {'id': U(), 'tile': {'x': -3, 'y': 6}, 'content': 'Data Layer',   'fontSize': 0.45, 'orientation': 'X'},
]
data = {'title': 'Microservices Architecture', 'icons': [], 'colors': [{'id':'blue','value':'#0066cc'},{'id':'green','value':'#00aa00'},{'id':'zone-red','value':'#FFB3BA'},{'id':'zone-blue','value':'#A7C7E7'},{'id':'zone-green','value':'#B5EAD7'}],
        'items': model_items,
        'views': [{'id': U(), 'name': 'Overview', 'items': view_items, 'connectors': connectors, 'rectangles': rects, 'textBoxes': texts}],
        'fitToScreen': True}
json.dump(data, open(sys.argv[1], 'w'), indent=2)
print('written', sys.argv[1], len(model_items), 'items', len(connectors), 'connectors')
