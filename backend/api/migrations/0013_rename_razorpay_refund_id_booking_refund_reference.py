from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ('api', '0012_booking_cancellation_fee_booking_cancelled_at_and_more'),
    ]

    operations = [
        migrations.RenameField(
            model_name='booking',
            old_name='razorpay_refund_id',
            new_name='refund_reference',
        ),
    ]
