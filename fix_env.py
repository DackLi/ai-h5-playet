# -*- coding: utf-8 -*-
import os

dev_content = u"""# \u6d4b\u8bd5\u73af\u5883\u914d\u7f6e
# API \u8bf7\u6c42\u57fa\u7840\u5730\u5740\uff08\u77ed\u5267\u6570\u636e API\uff09
NEXT_PUBLIC_API_BASE_URL=https://video.beesads.com
# \u73af\u5883\u6807\u8bc6
NEXT_PUBLIC_ENV=development
# \u7f51\u7ad9\u57df\u540d\uff08\u6d4b\u8bd5\uff09
NEXT_PUBLIC_SITE_URL=https://test.example.com
# \u5e7f\u544a SDK \u7ad9\u70b9 ID\uff08\u6d4b\u8bd5\uff09
NEXT_PUBLIC_ADS_SITE_ID=256

# \u5e7f\u544a SDK \u811a\u672c\u5730\u5740\uff08\u6d4b\u8bd5\u73af\u5883\uff09
NEXT_PUBLIC_ADS_TAG_URL=https://sdk-test.beesads.com/v1/ads-tag.js

# GameBridge API \u5730\u5740\uff08\u6d4b\u8bd5\u73af\u5883\uff0c\u670d\u52a1\u7aef\u4e13\u7528\uff09
GAMEBRIDGE_API_URL=http://test-service.gamebridge.games/gamebridge/v1
"""

prod_content = u"""# \u7ebf\u4e0a\u73af\u5883\u914d\u7f6e
# API \u8bf7\u6c42\u57fa\u7840\u5730\u5740\uff08\u77ed\u5267\u6570\u636e API\uff09
NEXT_PUBLIC_API_BASE_URL=https://video.beesads.com
# \u73af\u5883\u6807\u8bc6
NEXT_PUBLIC_ENV=production
# \u7f51\u7ad9\u57df\u540d\uff08\u6b63\u5f0f\uff09
NEXT_PUBLIC_SITE_URL=https://www.example.com
# \u5e7f\u544a SDK \u7ad9\u70b9 ID\uff08\u6b63\u5f0f\uff09
NEXT_PUBLIC_ADS_SITE_ID=24791846

# \u5e7f\u544a SDK \u811a\u672c\u5730\u5740\uff08\u6b63\u5f0f\u73af\u5883\uff09
NEXT_PUBLIC_ADS_TAG_URL=https://sdk.beesads.com/v1/ads-tag.js

# GameBridge API \u5730\u5740\uff08\u6b63\u5f0f\u73af\u5883\uff0c\u670d\u52a1\u7aef\u4e13\u7528\uff09
GAMEBRIDGE_API_URL=https://service.gamebridge.games/gamebridge/v1
"""

script_dir = os.path.dirname(os.path.abspath(__file__))

with open(os.path.join(script_dir, '.env.development'), 'w', encoding='utf-8', newline='\n') as f:
    f.write(dev_content)

with open(os.path.join(script_dir, '.env.production'), 'w', encoding='utf-8', newline='\n') as f:
    f.write(prod_content)

print("Files written successfully!")
