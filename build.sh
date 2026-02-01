TAG=1.2
docker build -t registry.gitlab.com/razniewski/cybertap-registry/front:$TAG .
docker push registry.gitlab.com/razniewski/cybertap-registry/front:$TAG
