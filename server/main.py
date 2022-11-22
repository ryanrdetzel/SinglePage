import json
import boto3
import uuid
import stripe
import random
import bcrypt
import os

from botocore.errorfactory import ClientError

s3 = boto3.client('s3')
stripe.api_key = os.environ.get('stripeKeyDev')

BUCKET = "beta.singlepage.cc"
KEY = "pending/"

URL_UNKNOWN = 1
URL_VALID = 2
URL_INVALID = 3

"""
Checks to see if a url is valid and available
TODO: Check if it's valid too.
"""


def check_if_url_is_taken(url: str) -> int:
    try:
        if not url:
            return URL_UNKNOWN
        else:
            s3.head_object(Bucket=BUCKET, Key=url)
            return URL_INVALID
    except ClientError:
        # If the object doesn't exist we get an error so this means it's valid
        return URL_VALID


"""
Builds a random phrase to use for page edit/deletion
"""


def get_random_phrase() -> str:
    file1 = open('wordlist', 'r')
    words = file1.readlines()
    word_list = [x.strip() for x in words]
    list = []
    for i in range(5):
        list.append(random.choice(word_list).strip())
    return " ".join(list)


"""
Publish (or save) the page to S3.
This includes adding the final html and css and adding metadata to the object
"""


def publish_page(secretPhrase, genId, themeName, content, url):
    try:
        # Encrypt the secret phrase
        secretPhrase = secretPhrase.encode('utf-8')
        salt = bcrypt.gensalt()
        hashed = bcrypt.hashpw(secretPhrase, salt)

        secretPhraseStr = hashed.decode('utf8')
        final_key = f"{KEY}{genId}"
        metadata = {
            "final-url": url,
            "secret-phrase": secretPhraseStr
        }

        # We want to add extra stuff to the page first.
        with open('final.html', 'r') as file:
            preview = file.read()

        # Error check, default to one if not found.
        with open(themeName + '.css', 'r') as file:
            theme = file.read()

        # Replace the target string
        preview = preview.replace('<!-- REPLACE -->', content)
        preview = preview.replace('/* EXTRA_CSS */', theme)
        preview = preview.replace('<!-- THEME -->', themeName)

        s3.put_object(Body=preview, Bucket=BUCKET, Key=final_key,
                      ContentType='text/html', Metadata=metadata)
        return True
    except Exception as e:
        print(e)
        return False


def complete_page_publish(genId):
    try:
        # Get the object w/ metadata
        final_key = f"{KEY}{genId}"
        response = s3.get_object(Bucket=BUCKET, Key=final_key)
        # Get the final url from the object metadata
        actual_filename = response['ResponseMetadata']['HTTPHeaders']['x-amz-meta-final-url']

        # move the object to the root
        s3_resource = boto3.resource("s3")
        s3_resource.Object(BUCKET, actual_filename).copy_from(
            CopySource=f"{BUCKET}/{final_key}")

        # Delete the old object
        s3.delete_object(Bucket=BUCKET, Key=final_key)
        return actual_filename
    except Exception as e:
        print(e)
        return None


"""
Calls stripe to setup the payment.
Returns the client secret used in the form
"""


def stripe_payment_setup(genId) -> str:
    try:
        # Create a PaymentIntent with the order amount and currency
        intent = stripe.PaymentIntent.create(
            amount=100,
            currency='usd',
            automatic_payment_methods={
                'enabled': True,
            },
            metadata={
                "genId": genId
            }
        )

        return intent['client_secret']
    except Exception as e:
        print(e)
        return None


def action_handler(event, context):

    try:
        content = {}
        rawPath = event["rawPath"]

        # Checks to see if the URL is valid (in use)
        if rawPath == "/checkUrl":
            body = json.loads(event["body"])
            url_valid_status = check_if_url_is_taken(body["url"])
            return {
                "statusCode": 200,
                "body": json.dumps({"valid": url_valid_status})
            }
        # Gets a random phrase to use for page edit/deletion
        elif rawPath == "/phrase":
            phrase = get_random_phrase()
            return {
                "statusCode": 200,
                "body": json.dumps({"phrase": phrase})
            }
        # Publishes the page to S3
        elif rawPath == "/publish":
            body = json.loads(event["body"])
            url = body["url"]
            content = body["content"]
            genId = body["genId"]
            secretPhrase = body["secretPhrase"]
            themeName = body["theme"]

            if (publish_page(secretPhrase, genId, themeName, content, url)):
                return {
                    "statusCode": 200,
                    "body": json.dumps({"genId": genId})
                }

            return {
                "statusCode": 500,
                "body": "Error publishing page"
            }
        # This is called when the stripe payment has been completed
        elif rawPath == "/complete":
            metadata = json.loads(event["body"])["data"]["object"]["metadata"]
            # TODO: Validate - Security hole, this could be called by anyone and publish the page for free
            genId = metadata["genId"]

            actual_filename = complete_page_publish(genId)
            if actual_filename:
                return {
                    "statusCode": 200,
                    "body": json.dumps({"actual_filename": actual_filename})
                }

            return {
                "statusCode": 500,
                "body": "Error publishing page"
            }
        # Called by the webapp to setup the payment form
        elif rawPath == "/paysetup":
            body = json.loads(event["body"])
            genId = body["genId"]
            client_secret = stripe_payment_setup(genId)

            if client_secret:
                return {
                    "statusCode": 200,
                    "body": json.dumps({
                        'clientSecret': client_secret
                    })
                }
            else:
                return {
                    "statusCode": 403,
                    "body": json.dumps({"error": "something"})
                }
    except Exception as e:
        print(e)
        print('Error getting object {} from bucket {}. Make sure they exist and your bucket is in the same region as this function.'.format(KEY, BUCKET))
        raise e
