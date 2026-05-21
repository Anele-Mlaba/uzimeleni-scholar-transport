import json
import uuid

from common.response import bad_request, created, method_not_allowed, not_found, ok

# TODO: Uncomment when DynamoDB is wired up
# import os
# import boto3
# from boto3.dynamodb.conditions import Key, Attr
# dynamodb = boto3.resource('dynamodb')
# table = dynamodb.Table(os.environ['TABLE_NAME'])


def lambda_handler(event, context):
    method = event.get('httpMethod', '')
    path_params = event.get('pathParameters') or {}
    owner_id = path_params.get('id')
    resource = event.get('resource') or event.get('path') or ''

    if owner_id and resource.endswith('/drivers'):
        # /owners/{id}/drivers
        if method == 'GET':
            return _list_drivers(owner_id)
    elif owner_id:
        # /owners/{id}
        if method == 'GET':
            return _get(owner_id)
        if method == 'PUT':
            return _update(owner_id, event)
        if method == 'DELETE':
            return _delete(owner_id)
    else:
        # /owners
        if method == 'GET':
            return _list()
        if method == 'POST':
            return _create(event)

    return method_not_allowed()


# ── Handlers ──────────────────────────────────────────────────────────────────

def _list():
    # TODO: Query DynamoDB
    # resp = table.query(
    #     IndexName='entity-type-index',
    #     KeyConditionExpression=Key('entity_type').eq('OWNER'),
    # )
    # owners = resp.get('Items', [])
    owners = []
    return ok({'owners': owners, 'count': len(owners)})


def _get(owner_id):
    # TODO: Fetch from DynamoDB
    # resp = table.get_item(Key={'pk': f'OWNER#{owner_id}', 'sk': 'PROFILE'})
    # owner = resp.get('Item')
    # if not owner:
    #     return not_found(f'Owner {owner_id} not found')
    owner = {'owner_id': owner_id}  # placeholder
    return ok({'owner': owner})


def _create(event):
    body = _parse_body(event)

    for field in ('name', 'id_number', 'phone', 'email'):
        if not body.get(field):
            return bad_request(f'{field} is required')

    owner_id = str(uuid.uuid4())

    # TODO: Store in DynamoDB
    # table.put_item(Item={
    #     'pk': f'OWNER#{owner_id}',
    #     'sk': 'PROFILE',
    #     'entity_type': 'OWNER',
    #     'owner_id': owner_id,
    #     'name': body['name'],
    #     'id_number': body['id_number'],
    #     'phone': body['phone'],
    #     'email': body['email'],
    #     'address': body.get('address', ''),
    #     'created_at': _now(),
    # })

    return created({'message': 'Owner created', 'owner_id': owner_id})


def _update(owner_id, event):
    body = _parse_body(event)
    if not body:
        return bad_request('Request body is required')

    # TODO: Update in DynamoDB
    # table.update_item(
    #     Key={'pk': f'OWNER#{owner_id}', 'sk': 'PROFILE'},
    #     UpdateExpression='SET #n = :name, phone = :phone, updated_at = :ts',
    #     ExpressionAttributeNames={'#n': 'name'},
    #     ExpressionAttributeValues={
    #         ':name': body.get('name'),
    #         ':phone': body.get('phone'),
    #         ':ts': _now(),
    #     },
    # )

    return ok({'message': 'Owner updated', 'owner_id': owner_id})


def _delete(owner_id):
    # TODO: Delete from DynamoDB
    # table.delete_item(Key={'pk': f'OWNER#{owner_id}', 'sk': 'PROFILE'})

    return ok({'message': 'Owner deleted', 'owner_id': owner_id})


def _list_drivers(owner_id):
    # TODO: Confirm owner exists, then query DynamoDB for drivers scoped to them.
    # owner_resp = table.get_item(Key={'pk': f'OWNER#{owner_id}', 'sk': 'PROFILE'})
    # if not owner_resp.get('Item'):
    #     return not_found(f'Owner {owner_id} not found')
    # resp = table.query(
    #     IndexName='entity-type-index',
    #     KeyConditionExpression=Key('entity_type').eq('DRIVER'),
    #     FilterExpression=Attr('owner_id').eq(owner_id),
    # )
    # drivers = resp.get('Items', [])
    drivers = []
    return ok({'drivers': drivers, 'count': len(drivers)})


# ── Helpers ───────────────────────────────────────────────────────────────────

def _parse_body(event):
    try:
        return json.loads(event.get('body') or '{}')
    except (json.JSONDecodeError, TypeError):
        return {}
