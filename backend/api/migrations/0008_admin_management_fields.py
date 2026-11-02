from django.db import migrations, models


def preserve_seeded_coupon_minimums(apps, schema_editor):
    Coupon = apps.get_model('api', 'Coupon')
    minimums = {
        'TRUMI10': 2000,
        'LUXURY25': 5000,
        'WELCOME20': 3000,
        'SUMMER50': 4000,
    }
    for code, amount in minimums.items():
        Coupon.objects.filter(code=code).update(min_order=amount)


class Migration(migrations.Migration):

    dependencies = [
        ('api', '0007_booking_email_and_nights_fields'),
    ]

    operations = [
        migrations.AddField(
            model_name='hotel',
            name='is_active',
            field=models.BooleanField(default=True),
        ),
        migrations.AddField(
            model_name='coupon',
            name='min_order',
            field=models.PositiveIntegerField(default=0),
        ),
        migrations.RunPython(preserve_seeded_coupon_minimums, migrations.RunPython.noop),
    ]
