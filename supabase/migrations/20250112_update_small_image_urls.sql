-- Update small Amazon image thumbnails to larger sizes
UPDATE asins
SET main_image_url = REGEXP_REPLACE(main_image_url, '_SL[0-9]+_', '_SL500_', 'g')
WHERE main_image_url ~ '_SL[0-9]+_' 
  AND (
    main_image_url LIKE '%_SL75_%' 
    OR main_image_url LIKE '%_SL50_%'
    OR main_image_url LIKE '%_SL100_%'
    OR main_image_url LIKE '%_SL160_%'
    OR main_image_url LIKE '%_SL250_%'
  );