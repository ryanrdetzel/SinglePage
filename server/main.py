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


def action_handler(event, context):
    bucket = "beta.singlepage.cc"
    key = "pending/"

    try:
        content = {}
        rawPath = event["rawPath"]

        if rawPath == "/checkUrl":
            body = json.loads(event["body"])
            url = body["url"]
            if not url:
                return {
                    "statusCode": 200,
                    "body": json.dumps({"valid": 1})
                }

            try:
                s3.head_object(Bucket=bucket, Key=url)
                return {
                    "statusCode": 200,
                    "body": json.dumps({"valid": 3})
                }
            except ClientError:
                return {
                    "statusCode": 200,
                    "body": json.dumps({"valid": 2})
                }
        elif rawPath == "/phrase":
            file1 = open('wordlist', 'r')
            words = file1.readlines()
            word_list = [x.strip() for x in words]
            list = []
            for i in range(5):
                list.append(random.choice(word_list).strip())
            return {
                "statusCode": 200,
                "body": json.dumps({"phrase": " ".join(list)})
            }
        elif rawPath == "/publish":
            body = json.loads(event["body"])
            url = body["url"]
            content = body["content"]
            genId = body["genId"]
            secretPhrase = body["secretPhrase"]
            themeName = body["theme"]

            # Encrypt it
            secretPhrase = secretPhrase.encode('utf-8')
            salt = bcrypt.gensalt()
            hashed = bcrypt.hashpw(secretPhrase, salt)
            secretPhraseStr = hashed.decode('utf8')
            final_key = f"{key}{genId}"
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
            s3.put_object(Body=preview, Bucket=bucket, Key=final_key,
                          ContentType='text/html', Metadata=metadata)

            return {
                "statusCode": 200,
                "body": json.dumps({"genId": genId})
            }
        elif rawPath == "/complete":
            metadata = json.loads(event["body"])["data"]["object"]["metadata"]

            # This is called when payment has been completed.
            # TODO: Validate
            genId = metadata["genId"]

            # Get the object w/ metadata
            # Get the final url
            final_key = f"{key}{genId}"
            response = s3.get_object(Bucket=bucket, Key=final_key)
            actual_filename = response['ResponseMetadata']['HTTPHeaders']['x-amz-meta-final-url']
            print("Actual Filename ", actual_filename)

            # move the object to the root
            s3_resource = boto3.resource("s3")
            s3_resource.Object(bucket, actual_filename).copy_from(
                CopySource=f"{bucket}/{final_key}")

            # TODO Remove old object.
            s3.delete_object(Bucket=bucket, Key=final_key)

            return {
                "statusCode": 200,
                "body": json.dumps({"actual_filename": actual_filename})
            }
        elif rawPath == "/paysetup":
            body = json.loads(event["body"])
            genId = body["genId"]
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

                return {
                    "statusCode": 200,
                    "body": json.dumps({
                        'clientSecret': intent['client_secret']
                    })
                }
            except Exception as e:
                print(e)
                return {
                    "statusCode": 403,
                    "body": json.dumps({"error": "something"})
                }
    except Exception as e:
        print(e)
        print('Error getting object {} from bucket {}. Make sure they exist and your bucket is in the same region as this function.'.format(key, bucket))
        raise e
