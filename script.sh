files="*/update*.ts"

for filepath in $files; do
  echo  $filepath
  if [ "$1" = "update" ]; then
    deno task update $filepath
  elif [ "$1" = "check" ]; then
    deno task check $filepath
  fi
done
