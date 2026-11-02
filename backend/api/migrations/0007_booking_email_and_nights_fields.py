from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('api', '0006_booking_razorpay_order_id_and_more'),
    ]

    operations = [
        migrations.AddField(
            model_name='booking',
            name='email_sent',
            field=models.BooleanField(default=False),
        ),
        migrations.AddField(
            model_name='booking',
            name='email_sent_at',
            field=models.DateTimeField(blank=True, null=True),
        ),
        migrations.AddField(
            model_name='booking',
            name='email_attempts',
            field=models.IntegerField(default=0),
        ),
        migrations.AddField(
            model_name='booking',
            name='nights',
            field=models.IntegerField(default=1),
        ),
    ]
